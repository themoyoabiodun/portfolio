// Three.js presentation of the Book Stack phone screens. Flat UI layers are
// drawn from the Figma specs into textures; covers are real 3D books.
import * as ThreeModule from "three";

import backIcon from "./assets/figma/detail-back.png";
import editIcon from "./assets/figma/detail-edit.png";
import shareIcon from "./assets/figma/detail-share.png";
import bellIcon from "./assets/figma/icon-bell.png";
import checkIcon from "./assets/figma/icon-check.png";
import giftIcon from "./assets/figma/icon-gift.png";
import gridIcon from "./assets/figma/icon-grid.png";
import navAddIcon from "./assets/figma/icon-nav-add.png";
import navBooksIcon from "./assets/figma/icon-nav-books.png";
import navStatsIcon from "./assets/figma/icon-nav-stats.png";
import searchIcon from "./assets/figma/icon-search.png";
import sparkleIcon from "./assets/figma/icon-sparkle.png";
import batteryIcon from "./assets/figma/status-battery.png";
import wifiIcon from "./assets/figma/status-wifi.png";
import {
  CAROUSEL_BOOKS,
  CAROUSEL_TITLE_TOP,
  DETAIL_PROGRESS,
  DETAIL_TEXT_TOP,
  PHONE_HEIGHT,
  PHONE_NAVY,
  PHONE_RADIUS,
  PHONE_WHITE,
  PHONE_WIDTH,
  type PhoneBook,
} from "./phone-data";
import type { PhoneBookPose, PhoneFrame, PhoneTextPose } from "./phone-sequence";

// Three.js values stay untyped here: its deep generic types exceed the
// Toolcraft boundary checker. The exported surface is fully typed.
type Any = any;
const THREE: Any = ThreeModule;

const SCALE = 3; // texture pixels per Figma pixel
const UNIT = 100; // Figma pixels per world unit
const FONT = '"Inter Variable", Inter, sans-serif';

export type PhoneCameraPose = Readonly<{
  defaultPosition: readonly [number, number, number];
  position: readonly [number, number, number];
}>;

type PixelData = Readonly<{ data: Uint8Array; height: number; width: number }>;
type Paint = OffscreenCanvasRenderingContext2D;
type Icons = Readonly<Record<keyof typeof ICON_URLS, ImageBitmap>>;

const ICON_URLS = {
  back: backIcon,
  battery: batteryIcon,
  bell: bellIcon,
  check: checkIcon,
  edit: editIcon,
  gift: giftIcon,
  grid: gridIcon,
  navAdd: navAddIcon,
  navBooks: navBooksIcon,
  navStats: navStatsIcon,
  search: searchIcon,
  share: shareIcon,
  sparkle: sparkleIcon,
  wifi: wifiIcon,
} as const;

async function loadIcons(): Promise<Icons> {
  const entries = await Promise.all(
    Object.entries(ICON_URLS).map(async ([key, url]) => {
      const response = await fetch(url);
      const bitmap = await createImageBitmap(await response.blob());
      return [key, bitmap] as const;
    }),
  );
  return Object.fromEntries(entries) as Icons;
}

/** Draws in Figma pixels into a 3× bitmap and returns plain bytes. */
function paint(width: number, height: number, draw: (c: Paint) => void): PixelData {
  const canvas = new OffscreenCanvas(Math.ceil(width * SCALE), Math.ceil(height * SCALE));
  const c = canvas.getContext("2d");
  if (!c) throw new Error("Phone layers require a Canvas 2D context.");
  c.scale(SCALE, SCALE);
  draw(c);
  const pixels = c.getImageData(0, 0, canvas.width, canvas.height);
  return { data: new Uint8Array(pixels.data.buffer.slice(0)), height: canvas.height, width: canvas.width };
}

function roundRect(c: Paint, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

function text(
  c: Paint,
  value: string,
  x: number,
  y: number,
  size: number,
  weight: number,
  color: string,
  align: CanvasTextAlign = "center",
): void {
  c.font = `${weight} ${size}px ${FONT}`;
  c.letterSpacing = size >= 24 ? "0px" : "0.1px";
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = "middle";
  c.fillText(value, x, y);
}

function wrap(c: Paint, value: string, size: number, weight: number, maxWidth: number): string[] {
  c.font = `${weight} ${size}px ${FONT}`;
  const lines: string[] = [];
  let line = "";
  for (const word of value.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (c.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function icon(c: Paint, bitmap: ImageBitmap, cx: number, cy: number, size: number): void {
  const w = (bitmap.width / bitmap.height) * size;
  c.drawImage(bitmap, cx - w / 2, cy - size / 2, w, size);
}

function statusBar(c: Paint, icons: Icons, ink: string): void {
  text(c, "9:41", 79, 32, 17, 600, ink);
  roundRect(c, 148, 14, 94, 36, 18);
  c.fillStyle = "#000000";
  c.fill();
  c.fillStyle = ink;
  [4, 6.5, 9, 11.5].forEach((h, i) => {
    roundRect(c, 270 + i * 4.6, 37 - h, 3, h, 1);
    c.fill();
  });
  icon(c, icons.wifi, 306.5, 31.5, 14.3);
  icon(c, icons.battery, 339, 31.5, 13.7);
}

function homeChrome(icons: Icons): PixelData {
  return paint(PHONE_WIDTH, PHONE_HEIGHT, (c) => {
    statusBar(c, icons, "#000000");
    // Avatar and assistant (72:1935).
    c.beginPath();
    c.arc(38, 100, 22, 0, Math.PI * 2);
    c.fillStyle = "#31705E";
    c.fill();
    text(c, "AQ", 38, 100, 16, 600, "#BEFE1A");
    c.beginPath();
    c.arc(98, 100, 21.5, 0, Math.PI * 2);
    c.fillStyle = "#FFFFFF";
    c.fill();
    c.strokeStyle = "#EEEEEE";
    c.lineWidth = 1;
    c.stroke();
    icon(c, icons.sparkle, 98, 100, 20);
    // Search, notifications, gifts (72:1942).
    roundRect(c, 226.5, 78.5, 147, 45, 50);
    c.fillStyle = "#FFFFFF";
    c.fill();
    c.stroke();
    c.fillStyle = "#ECECEC";
    c.fillRect(274, 85, 1, 32);
    c.fillRect(325, 85, 1, 32);
    icon(c, icons.search, 249, 101, 20);
    icon(c, icons.bell, 300, 101, 20);
    icon(c, icons.gift, 351, 101, 24);
    // Tabs (72:1956) and layout switch (72:1963).
    roundRect(c, 16, 152, 96, 32, 8);
    c.fillStyle = "#E9E9E9";
    c.fill();
    text(c, "All Books", 64, 168, 14, 600, "#1C1816");
    text(c, "Reading", 156, 168, 14, 600, "#7D7D7D");
    text(c, "Finished", 245.5, 168, 14, 600, "#7D7D7D");
    c.save();
    c.shadowColor = "rgba(0,0,0,0.12)";
    c.shadowBlur = 3;
    c.shadowOffsetY = 1;
    c.beginPath();
    c.arc(358, 168, 16, 0, Math.PI * 2);
    c.fillStyle = "#252525";
    c.fill();
    c.restore();
    icon(c, icons.grid, 358, 168, 20);
    // Bottom navigation (72:1998).
    roundRect(c, 83.5, 742, 223, 64, 44);
    c.fillStyle = "#252525";
    c.fill();
    icon(c, icons.navBooks, 117.5, 774, 24);
    icon(c, icons.navAdd, 195, 774, 24);
    icon(c, icons.navStats, 272.5, 774, 24);
    roundRect(c, 147, 830, 96, 6, 10);
    c.fillStyle = "#D8D8D8";
    c.fill();
  });
}

function detailChrome(icons: Icons): PixelData {
  return paint(PHONE_WIDTH, PHONE_HEIGHT, (c) => {
    statusBar(c, icons, "#000000");
    const glass = "rgba(255,255,255,0.2)";
    c.beginPath();
    c.arc(38, 100, 21.5, 0, Math.PI * 2);
    c.fillStyle = glass;
    c.fill();
    c.strokeStyle = "rgba(238,238,238,0.1)";
    c.lineWidth = 1;
    c.stroke();
    icon(c, icons.back, 38, 100, 20);
    roundRect(c, 277.5, 78.5, 96, 45, 50);
    c.fillStyle = glass;
    c.fill();
    c.stroke();
    c.fillStyle = "rgba(236,236,236,0.1)";
    c.fillRect(325, 85, 1, 32);
    icon(c, icons.edit, 300, 101, 20);
    icon(c, icons.share, 351, 101, 20);
    roundRect(c, 147, 830, 96, 6, 10);
    c.fillStyle = "#D8D8D8";
    c.fill();
  });
}

function percent(book: PhoneBook): string {
  return `${Math.round(book.progress * 100)}%`;
}

type Sized = Readonly<{ height: number; pixels: PixelData; width: number; x: number; y: number }>;

function detailTexts(book: PhoneBook) {
  const width = 358;
  let lines: string[] = [];
  paint(1, 1, (c) => {
    lines = wrap(c, book.title, 24, 600, width);
  });
  const pillWidth = (() => {
    let measured = 0;
    paint(1, 1, (c) => {
      c.font = `500 14px ${FONT}`;
      measured = c.measureText(book.status).width;
    });
    return Math.ceil(measured) + 18;
  })();
  const pill: Sized = {
    height: 24,
    pixels: paint(pillWidth, 24, (c) => {
      roundRect(c, 0.5, 0.5, pillWidth - 1, 23, 20);
      c.strokeStyle = "#FFC98F";
      c.lineWidth = 1;
      c.stroke();
      text(c, book.status, pillWidth / 2, 12, 14, 500, "#FFC98F");
    }),
    width: pillWidth,
    x: (PHONE_WIDTH - pillWidth) / 2,
    y: DETAIL_TEXT_TOP,
  };
  const dateY = DETAIL_TEXT_TOP + 24 + 12;
  const date: Sized = {
    height: 22,
    pixels: paint(width, 22, (c) => text(c, book.date, width / 2, 11, 14, 500, "#959595")),
    width,
    x: 16,
    y: dateY,
  };
  const titleY = dateY + 22 + 12;
  const titleHeight = lines.length * 32;
  const title: Sized = {
    height: titleHeight,
    pixels: paint(width, titleHeight, (c) =>
      lines.forEach((line, i) => text(c, line, width / 2, 16 + i * 32, 24, 600, "#FFFFFF")),
    ),
    width,
    x: 16,
    y: titleY,
  };
  const author: Sized = {
    height: 22,
    pixels: paint(width, 22, (c) => text(c, book.author, width / 2, 11, 14, 500, "#959595")),
    width,
    x: 16,
    y: titleY + titleHeight + 12,
  };
  const row = DETAIL_PROGRESS;
  const progress: Sized = {
    height: row.height,
    pixels: paint(row.width, row.height, (c) => {
      roundRect(c, 0, 6.5, 200, 7, 10);
      c.fillStyle = "rgba(255,255,255,0.2)";
      c.fill();
      roundRect(c, 212.5, 0.5, 37, 19, 20);
      c.strokeStyle = "#364035";
      c.lineWidth = 1;
      c.stroke();
      text(c, percent(book), 231, 10, 12, 600, "#FFFFFF");
    }),
    width: row.width,
    x: row.x,
    y: row.y,
  };
  return { author, date, pill, progress, title };
}

function carouselTitle(book: PhoneBook): Sized {
  // 74:2081: 16/24 semibold title, 12/18 author, 5px apart, centred.
  const width = 358;
  let lines: string[] = [];
  paint(1, 1, (c) => {
    lines = wrap(c, book.title, 16, 600, 300);
  });
  const height = lines.length * 24 + 5 + 18;
  return {
    height,
    pixels: paint(width, height, (c) => {
      lines.forEach((line, i) => text(c, line, width / 2, 12 + i * 24, 16, 600, "#000000"));
      text(c, book.author, width / 2, lines.length * 24 + 5 + 9, 12, 600, "#000000");
    }),
    width,
    x: 194.5 - width / 2,
    y: CAROUSEL_TITLE_TOP,
  };
}

function gridBar(book: PhoneBook, fillColor: string): PixelData {
  return paint(108.67, 7, (c) => {
    roundRect(c, 0, 0, 108.67, 7, 10);
    c.fillStyle = "#E9E9E9";
    c.fill();
    c.save();
    c.clip();
    c.fillStyle = fillColor;
    c.fillRect(0, 0, 108.67 * book.progress, 7);
    c.restore();
  });
}

function finishedBadge(icons: Icons): PixelData {
  return paint(30, 30, (c) => {
    c.save();
    c.shadowColor = "rgba(0,0,0,0.12)";
    c.shadowBlur = 3;
    c.shadowOffsetY = 1;
    c.beginPath();
    c.arc(15, 15, 12, 0, Math.PI * 2);
    c.fillStyle = "rgba(37,37,37,0.4)";
    c.fill();
    c.restore();
    icon(c, icons.check, 15, 15, 16);
  });
}

function roundedMask(): PixelData {
  return paint(PHONE_WIDTH, PHONE_HEIGHT, (c) => {
    roundRect(c, 0, 0, PHONE_WIDTH, PHONE_HEIGHT, PHONE_RADIUS);
    c.fillStyle = "#FFFFFF";
    c.fill();
  });
}

function softShadow(): PixelData {
  return paint(100, 100, (c) => {
    c.filter = "blur(6px)";
    roundRect(c, 20, 20, 60, 60, 6);
    c.fillStyle = "#000000";
    c.fill();
  });
}

// Figma px → world: the screen is centred on the origin, y up.
const wx = (x: number) => (x - PHONE_WIDTH / 2) / UNIT;
const wy = (y: number) => (PHONE_HEIGHT / 2 - y) / UNIT;

type BookNode = {
  badge: Any | null;
  body: Any;
  cover: Any;
  group: Any;
  side: Any;
  size: { h: number; t: number; w: number };
  spine: Any;
  spineMat: Any;
};

export class PhoneStage {
  readonly camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 200);
  readonly scene = new THREE.Scene();
  readonly ready: Promise<void>;
  private icons: Icons | null = null;
  private readonly owned: { dispose(): void }[] = [];
  private readonly books = new Map<string, BookNode>();
  private readonly shadows = new Map<string, Any>();
  private readonly titlePlanes = new Map<string, Any>();
  private readonly gridBarPlanes = new Map<string, Any>();
  private readonly detailPlanes = new Map<string, Record<string, Any>>();
  private readonly background: Any;
  private readonly flood: Any;
  private readonly progressFill: Any;
  private homeChrome: Any = null;
  private detailChrome: Any = null;
  private badgeTexture: Any = null;
  private shadowTexture: Any;

  constructor() {
    this.scene.add(new THREE.AmbientLight("#FFFFFF", 1.6));
    const key = new THREE.DirectionalLight("#FFFFFF", 1.4);
    key.position.set(-4, 5, 8);
    this.scene.add(key);

    this.background = this.plane(PHONE_WIDTH, PHONE_HEIGHT, this.texture(roundedMask(), false), 0, true);
    this.background.material.alphaTest = 0.5;
    this.background.position.set(0, 0, 0);
    this.flood = new THREE.Mesh(this.own(new THREE.CircleGeometry(1, 96)), this.stencilled(
      new THREE.MeshBasicMaterial({ color: PHONE_NAVY, depthWrite: false, transparent: true }),
    ));
    this.flood.renderOrder = 2;
    this.scene.add(this.flood);
    this.progressFill = new THREE.Mesh(this.own(new THREE.PlaneGeometry(1, 1)), this.stencilled(
      new THREE.MeshBasicMaterial({ color: "#FFFFFF", depthWrite: false, transparent: true }),
    ));
    this.progressFill.renderOrder = 3.5;
    this.scene.add(this.progressFill);
    this.shadowTexture = this.texture(softShadow(), false);

    this.ready = loadIcons().then((icons) => {
      this.icons = icons;
      this.homeChrome = this.plane(PHONE_WIDTH, PHONE_HEIGHT, this.texture(homeChrome(icons)), 1);
      this.detailChrome = this.plane(PHONE_WIDTH, PHONE_HEIGHT, this.texture(detailChrome(icons)), 3);
      this.badgeTexture = this.texture(finishedBadge(icons));
    });
  }

  private own<T extends { dispose(): void }>(resource: T): T {
    this.owned.push(resource);
    return resource;
  }

  private texture(pixels: PixelData, colorManaged = true): Any {
    const texture = new THREE.DataTexture(pixels.data, pixels.width, pixels.height);
    texture.flipY = true;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 4;
    if (colorManaged) texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return this.own(texture);
  }

  /** Every screen layer only draws inside the rounded screen. */
  private stencilled(material: Any, write = false): Any {
    material.stencilWrite = true;
    material.stencilRef = 1;
    if (write) {
      material.stencilFunc = THREE.AlwaysStencilFunc;
      material.stencilZPass = THREE.ReplaceStencilOp;
    } else {
      material.stencilFunc = THREE.EqualStencilFunc;
      material.stencilFail = THREE.KeepStencilOp;
      material.stencilZFail = THREE.KeepStencilOp;
      material.stencilZPass = THREE.KeepStencilOp;
    }
    return this.own(material);
  }

  private plane(width: number, height: number, map: Any, order: number, writeStencil = false): Any {
    const material = this.stencilled(
      new THREE.MeshBasicMaterial({ depthWrite: false, map, transparent: true }),
      writeStencil,
    );
    const mesh = new THREE.Mesh(this.own(new THREE.PlaneGeometry(width / UNIT, height / UNIT)), material);
    mesh.renderOrder = order;
    this.scene.add(mesh);
    return mesh;
  }

  private placeFlat(mesh: Any, x: number, y: number, width: number, height: number, pose: PhoneTextPose, z = 0.002): void {
    mesh.visible = pose.opacity > 0.002;
    mesh.material.opacity = pose.opacity;
    mesh.position.set(wx(x + width / 2 + pose.dx), wy(y + height / 2 + pose.dy), z);
  }

  private bookNode(pose: PhoneBookPose): BookNode {
    const existing = this.books.get(pose.key);
    if (existing) return existing;
    const cover = this.stencilled(new THREE.MeshBasicMaterial({ color: pose.book.color, transparent: true }));
    const side = this.stencilled(new THREE.MeshLambertMaterial({ color: "#EFE9DD", transparent: true }));
    const spineMat = this.stencilled(new THREE.MeshLambertMaterial({
      color: new THREE.Color(pose.book.color).multiplyScalar(pose.book.color === "#FFFFFF" ? 0.86 : 0.7),
      transparent: true,
    }));
    const group = new THREE.Group();
    group.rotation.order = "YXZ";
    const body = new THREE.Mesh(new THREE.BufferGeometry(), [cover, side]);
    const spine = new THREE.Mesh(this.own(new THREE.BoxGeometry(1, 1, 1)), spineMat);
    body.renderOrder = 5;
    spine.renderOrder = 5;
    group.add(body, spine);
    this.scene.add(group);
    const node: BookNode = { badge: null, body, cover, group, side, size: { h: 0, t: 0, w: 0 }, spine, spineMat };
    this.books.set(pose.key, node);
    return node;
  }

  private shapeBook(node: BookNode, w: number, h: number, t: number): void {
    const s = node.size;
    if (Math.abs(s.w - w) < 0.25 && Math.abs(s.h - h) < 0.25 && Math.abs(s.t - t) < 0.1) return;
    node.size = { h, t, w };
    const r = Math.min(9, w / 2, h / 2) / UNIT;
    const W = w / UNIT;
    const H = h / UNIT;
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2 + r, -H / 2);
    shape.lineTo(W / 2 - r, -H / 2);
    shape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + r);
    shape.lineTo(W / 2, H / 2 - r);
    shape.quadraticCurveTo(W / 2, H / 2, W / 2 - r, H / 2);
    shape.lineTo(-W / 2 + r, H / 2);
    shape.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - r);
    shape.lineTo(-W / 2, -H / 2 + r);
    shape.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2);
    const depth = t / UNIT;
    const geometry = new THREE.ExtrudeGeometry(shape, { bevelEnabled: false, curveSegments: 6, depth });
    geometry.translate(0, 0, -depth / 2);
    node.body.geometry.dispose();
    node.body.geometry = geometry;
    node.spine.scale.set(2.4 / UNIT, H - 2 * r, depth * 1.02);
    node.spine.position.set(-W / 2 + 1.2 / UNIT, 0, 0);
    if (node.badge) {
      node.badge.scale.set(w / 108.67, w / 108.67, 1);
      node.badge.position.set(
        ((78.33 + 12 - 54.33) / 108.67) * W,
        -((125 + 12 - 79) / 158) * H,
        depth / 2 + 0.002,
      );
    }
  }

  private poseBook(pose: PhoneBookPose): void {
    const node = this.bookNode(pose);
    if (!node.badge && pose.book.progress >= 1 && this.badgeTexture) {
      // The finished check (72:1989) sits on the cover; 30px incl. shadow.
      node.badge = new THREE.Mesh(this.own(new THREE.PlaneGeometry(0.3, 0.3)), this.stencilled(
        new THREE.MeshBasicMaterial({ depthWrite: false, map: this.badgeTexture, transparent: true }),
      ));
      node.badge.renderOrder = 6;
      node.group.add(node.badge);
      node.size = { h: 0, t: 0, w: 0 };
    }
    this.shapeBook(node, pose.width, pose.height, pose.thickness);
    node.group.visible = pose.opacity > 0.002;
    node.group.position.set(wx(pose.x), wy(pose.y), (pose.elevation + pose.thickness / 2) / UNIT);
    node.group.rotation.set(pose.rotX, pose.rotY, 0);
    for (const material of [node.cover, node.side, node.spineMat]) material.opacity = pose.opacity;
    if (node.badge) node.badge.material.opacity = pose.opacity;

    let shadow = this.shadows.get(pose.key);
    if (!shadow) {
      shadow = new THREE.Mesh(this.own(new THREE.PlaneGeometry(1, 1)), this.stencilled(
        new THREE.MeshBasicMaterial({ color: "#000000", depthWrite: false, map: this.shadowTexture, transparent: true }),
      ));
      shadow.renderOrder = 4;
      this.scene.add(shadow);
      this.shadows.set(pose.key, shadow);
    }
    const lift = Math.max(0, pose.elevation);
    const spread = 1 + lift / 500 + 0.12 * pose.shadow;
    shadow.scale.set(((pose.width / 0.6) * spread) / UNIT, ((pose.height / 0.6) * spread) / UNIT, 1);
    shadow.position.set(wx(pose.x), wy(pose.y + 2 + lift * 0.12), 0.001);
    const strength = 0.08 + 0.17 * pose.shadow + Math.min(0.15, lift / 900);
    shadow.material.opacity = strength * pose.opacity;
    shadow.visible = node.group.visible;
  }

  apply(frame: PhoneFrame, camera: PhoneCameraPose, aspect: number): void {
    const ready = this.icons !== null;
    const detail = frame.detail;
    this.background.material.color.set(PHONE_WHITE);
    if (this.homeChrome) {
      this.homeChrome.visible = ready;
      this.homeChrome.material.opacity = frame.homeChromeOpacity;
    }

    this.flood.visible = frame.flood.radius > 0.5;
    this.flood.scale.setScalar(Math.max(frame.flood.radius, 0.001) / UNIT);
    this.flood.position.set(wx(frame.flood.x), wy(frame.flood.y), 0.0015);

    // Books in this frame; everything else is hidden.
    const seen = new Set<string>();
    for (const pose of frame.books) {
      seen.add(pose.key);
      this.poseBook(pose);
    }
    for (const [key, node] of this.books) {
      if (!seen.has(key)) {
        node.group.visible = false;
        const shadow = this.shadows.get(key);
        if (shadow) shadow.visible = false;
      }
    }

    // Grid progress bars move with their cards.
    const barKeys = new Set<string>();
    for (const bar of frame.gridBars) {
      const key = bar.book.id;
      barKeys.add(key);
      let mesh = this.gridBarPlanes.get(key);
      if (!mesh) {
        mesh = this.plane(108.67, 7, this.texture(gridBar(bar.book, bar.fillColor)), 1);
        this.gridBarPlanes.set(key, mesh);
      }
      this.placeFlat(mesh, bar.rect.x, bar.rect.y, bar.rect.width, bar.rect.height, { dx: 0, dy: 0, opacity: bar.opacity });
    }
    for (const [key, mesh] of this.gridBarPlanes) if (!barKeys.has(key)) mesh.visible = false;

    // Carousel titles.
    const titleKeys = new Set<string>();
    if (ready) {
      for (const entry of frame.carouselTitles) {
        titleKeys.add(entry.book.id);
        let mesh = this.titlePlanes.get(entry.book.id);
        if (!mesh) {
          const sized = carouselTitle(entry.book);
          mesh = this.plane(sized.width, sized.height, this.texture(sized.pixels), 1);
          mesh.userData.sized = sized;
          this.titlePlanes.set(entry.book.id, mesh);
        }
        const sized: Sized = mesh.userData.sized;
        this.placeFlat(mesh, sized.x, sized.y, sized.width, sized.height, entry.pose);
      }
    }
    for (const [key, mesh] of this.titlePlanes) if (!titleKeys.has(key)) mesh.visible = false;

    // Detail page.
    if (this.detailChrome) {
      this.detailChrome.visible = Boolean(detail) && ready;
      if (detail) this.placeFlat(this.detailChrome, 0, 0, PHONE_WIDTH, PHONE_HEIGHT, detail.chrome, 0.003);
    }
    for (const [id, planes] of this.detailPlanes) {
      if (!detail || detail.book.id !== id) for (const mesh of Object.values(planes)) mesh.visible = false;
    }
    this.progressFill.visible = false;
    if (detail && ready) {
      let planes = this.detailPlanes.get(detail.book.id);
      if (!planes) {
        const texts = detailTexts(detail.book);
        planes = {};
        for (const [name, sized] of Object.entries(texts)) {
          const mesh = this.plane(sized.width, sized.height, this.texture(sized.pixels), 3);
          mesh.userData.sized = sized;
          planes[name] = mesh;
        }
        this.detailPlanes.set(detail.book.id, planes);
      }
      for (const [name, mesh] of Object.entries(planes)) {
        const sized: Sized = mesh.userData.sized;
        const pose = detail.items[name as keyof typeof detail.items];
        this.placeFlat(mesh, sized.x, sized.y, sized.width, sized.height, pose, 0.003);
      }
      const fillWidth = Math.max(0.01, 200 * detail.progressFill);
      const p = detail.items.progress;
      this.progressFill.visible = p.opacity > 0.002;
      this.progressFill.material.opacity = p.opacity;
      this.progressFill.scale.set(fillWidth / UNIT, 7 / UNIT, 1);
      this.progressFill.position.set(wx(DETAIL_PROGRESS.x + fillWidth / 2), wy(DETAIL_PROGRESS.y + 10 + p.dy), 0.0035);
    }

    // Camera: the orbit gizmo's rotation away from its default, applied to
    // a straight-on view of the phone.
    const from = new THREE.Vector3(...camera.defaultPosition).normalize();
    const to = new THREE.Vector3(...camera.position).normalize();
    const turn = new THREE.Quaternion().setFromUnitVectors(from, to);
    const viewHeight = (PHONE_HEIGHT / UNIT) * 1.12;
    const distance = viewHeight / (2 * Math.tan((this.camera.fov / 2) * (Math.PI / 180)));
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(turn);
    this.camera.position.copy(direction.multiplyScalar(distance));
    this.camera.up.copy(new THREE.Vector3(0, 1, 0).applyQuaternion(turn));
    this.camera.lookAt(0, 0, 0);
    this.camera.aspect = aspect > 0 && Number.isFinite(aspect) ? aspect : 16 / 9;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    for (const node of this.books.values()) node.body.geometry.dispose();
    for (const resource of this.owned) resource.dispose();
    this.owned.length = 0;
    if (this.icons) for (const bitmap of Object.values(this.icons)) bitmap.close();
  }
}

export const PHONE_CAROUSEL_BOOK_COUNT = CAROUSEL_BOOKS.length;
