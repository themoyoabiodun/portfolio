// Three.js presentation of the shelf. One instance owns its renderer, scene,
// geometry and textures; `apply` poses it for one sequence frame.
import * as ThreeModule from "three";

// Three.js values stay untyped here: its deep generic types exceed the
// Toolcraft boundary checker. The public surface below is fully typed.
type Any = any;
const THREE: Any = ThreeModule;

import { HERO_BOOK, SHELF_BOOKS, type ShelfBook } from "./shelf-books";
import {
  SHELF_FRONT_Z,
  SHELF_TOP_Y,
  type ShelfBookPose,
  type ShelfSequenceFrame,
} from "./motion-sequence";

export type ShelfCameraPose = Readonly<{
  position: readonly [number, number, number];
  up: readonly [number, number, number];
}>;

const CAMERA_TARGET = new THREE.Vector3(0, 2.45, 0.4);
const PLANK_WIDTH = 6.6;
const PLANK_DEPTH = 1.7;
const PLANK_THICKNESS = 0.2;
const FRAME_HEIGHT = 3.1;

function createCanvas(width: number, height: number): OffscreenCanvas {
  return new OffscreenCanvas(width, height);
}

function context2d(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Shelf textures require a Canvas 2D context.");
  return context;
}

type PixelData = Readonly<{ data: Uint8Array; height: number; width: number }>;

/** Reads 2D-drawn pixels as plain bytes. */
function readPixels(canvas: OffscreenCanvas): PixelData {
  const pixels = context2d(canvas).getImageData(0, 0, canvas.width, canvas.height);
  return {
    data: new Uint8Array(pixels.data.buffer.slice(0)),
    height: canvas.height,
    width: canvas.width,
  };
}

/** Uploads plain pixel bytes as a Three.js texture. */
function pixelTexture(pixels: PixelData, colorManaged = true): Any {
  const texture = new THREE.DataTexture(pixels.data, pixels.width, pixels.height);
  texture.flipY = true;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  if (colorManaged) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function wrapLines(
  context: OffscreenCanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function coverTexture(book: ShelfBook): PixelData {
  const width = 512;
  const height = Math.round((width * book.height) / book.width);
  const canvas = createCanvas(width, height);
  const c = context2d(canvas);
  c.fillStyle = book.cover;
  c.fillRect(0, 0, width, height);
  const hinge = c.createLinearGradient(0, 0, 60, 0);
  hinge.addColorStop(0, "rgba(0,0,0,0.32)");
  hinge.addColorStop(0.5, "rgba(255,255,255,0.08)");
  hinge.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = hinge;
  c.fillRect(0, 0, 60, height);
  c.fillStyle = book.ink;
  c.font = "700 58px Georgia, 'Times New Roman', serif";
  const lines = wrapLines(c, book.title, width - 120);
  lines.forEach((line, index) => c.fillText(line, 70, 120 + index * 66));
  c.font = "500 22px Georgia, serif";
  c.globalAlpha = 0.8;
  c.fillText(book.author.toUpperCase(), 72, 140 + lines.length * 66);
  c.globalAlpha = 1;
  c.fillStyle = book.accent;
  c.strokeStyle = book.accent;
  const cx = width / 2 + 20;
  const cy = height * 0.68;
  if (book.ornament === 0) {
    c.beginPath();
    c.arc(cx, cy, 82, 0, Math.PI * 2);
    c.fill();
  } else if (book.ornament === 1) {
    for (let index = 0; index < 6; index += 1) {
      c.fillRect(cx - 110, cy - 70 + index * 26, 220, 12);
    }
  } else {
    c.lineWidth = 10;
    c.beginPath();
    c.moveTo(cx - 70, cy + 90);
    c.lineTo(cx - 70, cy - 20);
    c.arc(cx, cy - 20, 70, Math.PI, 0);
    c.lineTo(cx + 70, cy + 90);
    c.closePath();
    c.stroke();
  }
  return readPixels(canvas);
}

function spineTexture(book: ShelfBook): PixelData {
  const height = 1024;
  const width = Math.max(96, Math.round((height * book.depth) / book.height));
  const canvas = createCanvas(width, height);
  const c = context2d(canvas);
  c.fillStyle = book.cover;
  c.fillRect(0, 0, width, height);
  const shade = c.createLinearGradient(0, 0, width, 0);
  shade.addColorStop(0, "rgba(0,0,0,0.25)");
  shade.addColorStop(0.35, "rgba(255,255,255,0.16)");
  shade.addColorStop(0.6, "rgba(255,255,255,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.28)");
  c.fillStyle = shade;
  c.fillRect(0, 0, width, height);
  c.fillStyle = book.accent;
  c.fillRect(width * 0.15, 40, width * 0.7, 10);
  c.fillRect(width * 0.15, height - 50, width * 0.7, 10);
  c.save();
  c.translate(width / 2, height / 2);
  c.rotate(Math.PI / 2);
  c.fillStyle = book.ink;
  const size = Math.min(width * 0.42, 54);
  c.font = `700 ${size}px Georgia, 'Times New Roman', serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(book.title, 0, 0, height - 160);
  c.restore();
  return readPixels(canvas);
}

function pagesTexture(horizontal: boolean): PixelData {
  const canvas = createCanvas(256, 256);
  const c = context2d(canvas);
  c.fillStyle = "#F4EEE2";
  c.fillRect(0, 0, 256, 256);
  c.fillStyle = "#E2D9C6";
  for (let index = 0; index < 256; index += 3) {
    if (horizontal) c.fillRect(0, index, 256, 1);
    else c.fillRect(index, 0, 1, 256);
  }
  return readPixels(canvas);
}

function glowTexture(): PixelData {
  const canvas = createCanvas(256, 256);
  const c = context2d(canvas);
  const gradient = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.45)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = gradient;
  c.fillRect(0, 0, 256, 256);
  return readPixels(canvas);
}

/** The only surface product code sees: plain methods, no DOM or Three types. */
export interface ShelfRenderer {
  apply(frame: ShelfSequenceFrame, glowColor: string, camera: ShelfCameraPose, aspect: number): void;
  dispose(): void;
  hits(ndcX: number, ndcY: number): boolean;
  /** Renders, then copies the frame into a 2D destination rectangle. */
  present(
    destination: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void;
  resize(width: number, height: number): void;
}

export function createShelfRenderer(): ShelfRenderer {
  return new ShelfScene();
}

type BookMesh = Readonly<{
  book: ShelfBook;
  materials: Any[];
  mesh: Any;
}>;

class ShelfScene implements ShelfRenderer {
  private readonly camera = new THREE.PerspectiveCamera(26, 16 / 9, 0.1, 100);
  private readonly renderer: Any;
  private readonly scene = new THREE.Scene();
  private readonly books: BookMesh[];
  private readonly frameGroup = new THREE.Group();
  private readonly glowDisc: Any;
  private readonly glowLight = new THREE.PointLight("#FFD98A", 0, 5, 1.6);
  private readonly hero: BookMesh;
  private readonly owned: { dispose(): void }[] = [];
  private readonly pickable: Any[] = [];
  private readonly raycaster = new THREE.Raycaster();

  constructor() {
    // Three.js creates and owns its drawing surface; frames are copied out.
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.addLights();
    this.addShelfFrame();
    this.books = SHELF_BOOKS.map((book) => this.addBook(book));
    this.hero = this.addBook(HERO_BOOK);
    for (const material of this.hero.materials) material.transparent = true;

    const glowMap = this.own(pixelTexture(glowTexture(), false));
    const glowGeometry = this.own(new THREE.PlaneGeometry(1.6, 1.3));
    const glowMaterial = this.own(
      new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: glowMap,
        opacity: 0,
        transparent: true,
      }),
    );
    this.glowDisc = new THREE.Mesh(glowGeometry, glowMaterial);
    this.glowDisc.rotation.x = -Math.PI / 2;
    this.glowDisc.position.y = SHELF_TOP_Y + 0.004;
    this.frameGroup.add(this.glowDisc);
    this.scene.add(this.glowLight);
  }

  private own<T extends { dispose(): void }>(resource: T): T {
    this.owned.push(resource);
    return resource;
  }

  private addLights(): void {
    this.scene.add(new THREE.HemisphereLight("#FFFFFF", "#B9A58C", 1.4));
    const key = new THREE.DirectionalLight("#FFF6E8", 2.2);
    key.position.set(-3.5, 7, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -2;
    key.shadow.bias = -0.0004;
    key.shadow.radius = 4;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight("#DDE7FF", 0.6);
    fill.position.set(5, 3, 4);
    this.scene.add(fill);
  }

  private addShelfFrame(): void {
    const wood = this.own(
      new THREE.MeshStandardMaterial({ color: "#C49A6C", roughness: 0.62 }),
    );
    const darkWood = this.own(
      new THREE.MeshStandardMaterial({ color: "#A67B52", roughness: 0.7 }),
    );
    const back = this.own(
      new THREE.MeshStandardMaterial({ color: "#E6DED1", roughness: 0.95 }),
    );
    const plank = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(PLANK_WIDTH, PLANK_THICKNESS, PLANK_DEPTH)),
      wood,
    );
    plank.position.set(0, SHELF_TOP_Y - PLANK_THICKNESS / 2, 0);
    plank.receiveShadow = true;
    plank.castShadow = true;
    const backPanel = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(PLANK_WIDTH, FRAME_HEIGHT, 0.08)),
      back,
    );
    backPanel.position.set(0, FRAME_HEIGHT / 2 - PLANK_THICKNESS, -PLANK_DEPTH / 2);
    backPanel.receiveShadow = true;
    const sideGeometry = this.own(
      new THREE.BoxGeometry(0.16, FRAME_HEIGHT, PLANK_DEPTH),
    );
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(sideGeometry, darkWood);
      panel.position.set(
        side * (PLANK_WIDTH / 2 + 0.08),
        FRAME_HEIGHT / 2 - PLANK_THICKNESS,
        0,
      );
      panel.castShadow = true;
      panel.receiveShadow = true;
      this.frameGroup.add(panel);
      this.pickable.push(panel);
    }
    this.frameGroup.add(plank, backPanel);
    this.pickable.push(plank, backPanel);
    this.scene.add(this.frameGroup);
  }

  private addBook(book: ShelfBook): BookMesh {
    const pagesSide = this.own(pixelTexture(pagesTexture(false)));
    const pagesTop = this.own(pixelTexture(pagesTexture(true)));
    const cover = this.own(pixelTexture(coverTexture(book)));
    const spine = this.own(pixelTexture(spineTexture(book)));
    const color = new THREE.Color(book.cover);
    const material = (options: Any) =>
      this.own(new THREE.MeshStandardMaterial({ roughness: 0.72, ...options }));
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z.
    const materials = [
      material({ map: pagesSide, roughness: 0.9 }),
      material({ map: spine }),
      material({ map: pagesTop, roughness: 0.9 }),
      material({ map: pagesTop, roughness: 0.9 }),
      material({ map: cover }),
      material({ color: color.clone().multiplyScalar(0.85) }),
    ];
    const mesh = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(book.width, book.height, book.depth)),
      materials,
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.order = "ZXY";
    this.scene.add(mesh);
    this.pickable.push(mesh);
    return { book, materials, mesh };
  }

  private poseBook(target: BookMesh, pose: ShelfBookPose): void {
    const { mesh } = target;
    mesh.position.set(pose.x, pose.y, pose.z);
    mesh.rotation.set(pose.rotX, pose.rotY, pose.rotZ);
    mesh.scale.set(
      pose.scale * pose.scaleXZ,
      pose.scale * pose.scaleY,
      pose.scale * pose.scaleXZ,
    );
    mesh.visible = pose.opacity > 0.001;
    for (const material of target.materials) {
      if (material.transparent) material.opacity = pose.opacity;
    }
    mesh.castShadow = pose.opacity > 0.5;
  }

  /** Poses the scene for one sequence frame and camera. */
  apply(
    frame: ShelfSequenceFrame,
    glowColor: string,
    camera: ShelfCameraPose,
    aspect: number,
  ): void {
    this.frameGroup.position.y = frame.shelfOffsetY;
    frame.books.forEach((pose, index) => this.poseBook(this.books[index], pose));
    this.poseBook(this.hero, frame.hero);

    const glow = frame.glow.intensity;
    this.glowDisc.material.color.set(glowColor);
    this.glowDisc.material.opacity = glow * 0.9;
    this.glowDisc.visible = glow > 0.001;
    this.glowDisc.position.set(frame.glow.x, SHELF_TOP_Y + 0.004, Math.min(frame.glow.z + 0.35, SHELF_FRONT_Z - 0.1));
    this.glowLight.color.set(glowColor);
    this.glowLight.intensity = glow * 6;
    this.glowLight.position.set(frame.glow.x, SHELF_TOP_Y + 0.9, SHELF_FRONT_Z + 0.4);

    this.camera.aspect = aspect > 0 && Number.isFinite(aspect) ? aspect : 16 / 9;
    this.camera.position.set(
      CAMERA_TARGET.x + camera.position[0],
      CAMERA_TARGET.y + camera.position[1],
      CAMERA_TARGET.z + camera.position[2],
    );
    this.camera.up.set(camera.up[0], camera.up[1], camera.up[2]);
    this.camera.lookAt(CAMERA_TARGET);
    this.camera.updateProjectionMatrix();
  }

  private size = { height: 0, width: 0 };

  /** Sets the exact backing size in device pixels (no CSS resizing). */
  resize(width: number, height: number): void {
    if (this.size.width === width && this.size.height === height) return;
    this.size = { height, width };
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
  }

  present(
    destination: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    this.renderer.render(this.scene, this.camera);
    destination.drawImage(this.renderer.domElement, x, y, width, height);
  }

  /** True when normalized device coordinates hit any visible scene mesh. */
  hits(ndcX: number, ndcY: number): boolean {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    return this.raycaster
      .intersectObjects(this.pickable, false)
      .some((hit: Any) => hit.object.visible);
  }

  dispose(): void {
    for (const resource of this.owned) resource.dispose();
    this.owned.length = 0;
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
