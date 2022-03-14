import fs from "fs";
import path from "path";

import { getFontSize } from "./text-utils.mjs";

import {
  tmpImagePath,
  filenameParts,
  uploadFile,
  downloadFile,
} from "./file-utils.mjs";
import { Canvas } from "./canvas.mjs";

// TODO:
// - [ ] Add sources
// - [ ] Account for always at least one source, but not always three.
// - [x] Add logo uploader
// - [ ] Add logo to title after upload
// - [ ] Should work without a logo
// - [ ] Add icons to sources
// - [ ] Set y values based on content height
// - [ ] Keep the image filename specific to the date, but use the tool name as the directory

/**
 * Generates a meta image file for one news item and stores locally.
 */
export class ToolImageGenerator {
  constructor({ __dirname, tmpDir, item: { filePath, data } }) {
    this.__dirname = __dirname;
    this.imgPath = tmpImagePath(filePath, tmpDir);
    this.filePath = filePath;
    this.drawConfig = {
      bgImgPath: path.join(__dirname, "assets/tool-background.svg"),
      title: {
        text: data.title,
        maxFontSize: 110,
        maxContentWidth: 1000,
        color: "#051c28",
      },
      logo: {
        remoteSrc: data.logo,
        localSrc: null,
        uploadSrc: data.logo_to_upload
          ? path.join(__dirname, "../../", data.logo_to_upload)
          : null,
      },
      sources: {
        color: "#4B6A8A",
        website: {
          icon: "website.svg",
          text: data.sources?.website,
        },
        github: {
          icon: "github.svg",
          text: data.sources?.github,
        },
        twitter: {
          icon: "twitter.svg",
          text: data.sources?.twitter,
        },
      },
    };
  }

  async run() {
    this.canvas = new Canvas();
    await this.processLogo();
    this.setTitleConfig();
    // We need to know the height of all the content before we can determine the
    // y values for each item.
    this.setYValues();
    await this.drawBgImage();
    this.drawTitle();
    this.canvas.saveImage(this.imgPath);

    return this.imgPath;
  }

  // --- Config Getters ---

  canvasConfig() {
    return this.canvas.config;
  }

  titleConfig() {
    return this.drawConfig.title;
  }

  logoConfig() {
    return this.drawConfig.logo;
  }

  sourcesConfig() {
    return this.drawConfig.sources;
  }

  // --- Config Setters ---

  setTitleConfig() {
    const fontSize = getFontSize({
      fontSize: this.titleConfig().maxFontSize,
      context: this.canvas.context,
      text: this.titleConfig().text,
      maxLineWidth: this.titleConfig().maxContentWidth,
    });
    const x = 175;

    this.drawConfig.title = {
      ...this.titleConfig(),
      fontSize,
      x,
    };
  }

  setYValues() {
    // const contentHeight =
    //   this.titleConfig().lineHeight * (this.titleConfig().text.length + 0.5) +
    //   this.badgeBgConfig().h;

    // Title is placed at 25% of the content's height above center. This felt
    // more balanced than centering completely, which made the title feel like
    // it was too close to the top.
    // this.drawConfig.title.y = this.canvas.config.h / 2 - contentHeight / 4;
    this.drawConfig.title.y = 300;
    // The extra 0.5 is the margin between the title and the badge.
    // this.drawConfig.badge.text.y =
    //   this.titleConfig().y +
    //   this.titleConfig().lineHeight * (this.titleConfig().text.length + 0.5);
    // Like badge background x value, this is calculated from the badge text's
    // position, which is the center of the text, while the background's y is
    // the top of the rectangle.
    // this.drawConfig.badge.bg.y =
    //   this.badgeTextConfig().y -
    //   this.badgeTextConfig().fontSize -
    //   this.badgeBgConfig().paddingY +
    //   2;
  }

  // --- Draw Utils ---

  async drawBgImage() {
    await this.canvas.setBgImage(this.drawConfig.bgImgPath);
  }

  drawTitle() {
    const title = this.titleConfig();
    // this.canvas.context.textAlign = "center";
    this.canvas.setFont({ size: title.fontSize });
    this.canvas.context.fillStyle = title.color;
    this.canvas.context.fillText(title.text, title.x, title.y);
  }

  // --- Logo Uploader ---

  async processLogo() {
    if (this.logoConfig().uploadSrc) await this.uploadLogo();
    this.drawConfig.logo.localSrc = await downloadFile(
      this.logoConfig().remoteSrc
    );
    console.log(this.drawConfig);
    process.exit(0);
  }

  async uploadLogo() {
    const { slug } = filenameParts(this.filePath);
    const uploadPath = await uploadFile(
      this.logoConfig().uploadSrc,
      `tools/${slug}`,
      false
    );
    this.storeLogoRef(uploadPath);
    fs.unlinkSync(this.logoConfig().uploadSrc);
  }

  storeLogoRef(s3Path) {
    this.drawConfig.logo.remoteSrc = s3Path;
    const rawContent = fs.readFileSync(this.filePath).toString();
    const newFileContent = rawContent
      .replace(/logo_to_upload\: (.*)\n/, "") // remove tmp ref
      .replace(/^---/, `---\nlogo: /${s3Path}`); // add new ref
    return fs.writeFileSync(this.filePath, newFileContent);
  }
}
