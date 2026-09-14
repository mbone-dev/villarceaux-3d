import {
  Animation,
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
  VertexBuffer,
} from '@babylonjs/core';

export type QualityProfile = 'tablet' | 'high';
export type ViewId = 'depart' | 'fairway' | 'green' | 'overview';

interface CameraView {
  id: ViewId;
  alpha: number;
  beta: number;
  radius: number;
  target: [number, number, number];
  label: string;
}

interface SceneData {
  terrain: {
    width: number;
    depth: number;
    maxHeight: number;
    slopeRight: number;
    ridge: { x: number; z: number; gain: number; spread: number };
    greenRise: { x: number; z: number; gain: number; spread: number };
    bunker: {
      x: number;
      z: number;
      rx: number;
      rz: number;
      depth: number;
      lip: number;
      lipWidth: number;
    };
  };
  cameras: CameraView[];
}

interface HoleData {
  metadata: { name: string; distance_m: { value: number | null } };
}

export interface MountOptions {
  container: HTMLElement;
  sceneData: SceneData;
  holeData: HoleData;
  quality?: QualityProfile;
  autoStartTour?: boolean;
}

export interface HoleViewerApi {
  setView: (viewId: ViewId) => void;
  startTour: () => void;
  stopTour: () => void;
  setQuality: (quality: QualityProfile) => void;
  dispose: () => void;
}

function gaussian(x: number, z: number, cx: number, cz: number, gain: number, spread: number): number {
  const dx = x - cx;
  const dz = z - cz;
  return gain * Math.exp(-(dx * dx + dz * dz) / (spread * spread));
}

export function mountHoleViewer(options: MountOptions): HoleViewerApi {
  const { container, sceneData, holeData } = options;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);
  const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: false, stencil: true });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.73, 0.84, 0.93, 1);

  const camera = new ArcRotateCamera('camera', -Math.PI / 2, 1.02, 310, new Vector3(0, 6, 45), scene);
  camera.attachControl(canvas, true);
  camera.lowerBetaLimit = 0.45;
  camera.upperBetaLimit = 1.4;
  camera.lowerRadiusLimit = 35;
  camera.upperRadiusLimit = 420;
  camera.wheelDeltaPercentage = 0.01;
  camera.panningSensibility = 80;

  const hemi = new HemisphericLight('hemi', new Vector3(0.2, 1, 0.1), scene);
  hemi.intensity = 0.58;

  const sun = new DirectionalLight('sun', new Vector3(-0.65, -1, 0.2), scene);
  sun.position = new Vector3(140, 230, -150);
  sun.intensity = 1.1;

  const terrain = sceneData.terrain;
  const terrainMesh = MeshBuilder.CreateGround('terrain', {
    width: terrain.width,
    height: terrain.depth,
    subdivisions: 120,
  }, scene);

  const getHeight = (x: number, z: number): number => {
    let y = 0;
    y += (x / (terrain.width * 0.5)) * terrain.slopeRight;
    y += gaussian(x, z, terrain.ridge.x, terrain.ridge.z, terrain.ridge.gain, terrain.ridge.spread);
    y += gaussian(x, z, terrain.greenRise.x, terrain.greenRise.z, terrain.greenRise.gain, terrain.greenRise.spread);

    const nx = (x - terrain.bunker.x) / terrain.bunker.rx;
    const nz = (z - terrain.bunker.z) / terrain.bunker.rz;
    const d2 = nx * nx + nz * nz;
    if (d2 < 1.35) {
      const bowl = Math.max(0, 1 - d2);
      y -= bowl * terrain.bunker.depth;
      const lipRing = Math.exp(-Math.pow(Math.sqrt(d2) - 1, 2) / (terrain.bunker.lipWidth * terrain.bunker.lipWidth));
      y += lipRing * terrain.bunker.lip;
    }

    return y;
  };

  const pos = terrainMesh.getVerticesData(VertexBuffer.PositionKind);
  if (!pos) throw new Error('Impossible de lire les sommets du terrain.');
  for (let i = 0; i < pos.length; i += 3) {
    pos[i + 1] = getHeight(pos[i], pos[i + 2]);
  }
  terrainMesh.updateVerticesData(VertexBuffer.PositionKind, pos);
  terrainMesh.convertToFlatShadedMesh();

  const roughMat = new PBRMaterial('rough', scene);
  roughMat.albedoColor = new Color3(0.27, 0.45, 0.24);
  roughMat.roughness = 0.92;
  roughMat.metallic = 0;
  terrainMesh.material = roughMat;

  const fairway = MeshBuilder.CreateDisc('fairway', { radius: 42, tessellation: 64 }, scene);
  fairway.scaling = new Vector3(1.2, 1, 4.5);
  fairway.rotation.x = Math.PI / 2;
  fairway.position = new Vector3(14, 0.03, 18);
  const fairwayPos = fairway.getVerticesData(VertexBuffer.PositionKind);
  if (fairwayPos) {
    for (let i = 0; i < fairwayPos.length; i += 3) {
      const wx = fairwayPos[i] * fairway.scaling.x + fairway.position.x;
      const wz = fairwayPos[i + 2] * fairway.scaling.z + fairway.position.z;
      fairwayPos[i + 1] = getHeight(wx, wz) + 0.06;
    }
    fairway.updateVerticesData(VertexBuffer.PositionKind, fairwayPos);
  }
  const fairwayMat = new PBRMaterial('fairwayMat', scene);
  fairwayMat.albedoColor = new Color3(0.35, 0.58, 0.28);
  fairwayMat.roughness = 0.88;
  fairway.material = fairwayMat;

  const green = MeshBuilder.CreateDisc('green', { radius: 19, tessellation: 64 }, scene);
  green.scaling = new Vector3(1.2, 1, 0.95);
  green.rotation.x = Math.PI / 2;
  green.position = new Vector3(25, 0.08, 155);
  const greenPos = green.getVerticesData(VertexBuffer.PositionKind);
  if (greenPos) {
    for (let i = 0; i < greenPos.length; i += 3) {
      const wx = greenPos[i] * green.scaling.x + green.position.x;
      const wz = greenPos[i + 2] * green.scaling.z + green.position.z;
      greenPos[i + 1] = getHeight(wx, wz) + 0.09;
    }
    green.updateVerticesData(VertexBuffer.PositionKind, greenPos);
  }
  const greenMat = new PBRMaterial('greenMat', scene);
  greenMat.albedoColor = new Color3(0.42, 0.67, 0.32);
  greenMat.roughness = 0.83;
  green.material = greenMat;

  const bunkerSand = MeshBuilder.CreateDisc('bunker', { radius: terrain.bunker.rx * 0.95, tessellation: 56 }, scene);
  bunkerSand.scaling = new Vector3(1, 1, terrain.bunker.rz / terrain.bunker.rx);
  bunkerSand.rotation.x = Math.PI / 2;
  bunkerSand.position = new Vector3(terrain.bunker.x, 0.02, terrain.bunker.z);
  const bunkerPos = bunkerSand.getVerticesData(VertexBuffer.PositionKind);
  if (bunkerPos) {
    for (let i = 0; i < bunkerPos.length; i += 3) {
      const wx = bunkerPos[i] * bunkerSand.scaling.x + bunkerSand.position.x;
      const wz = bunkerPos[i + 2] * bunkerSand.scaling.z + bunkerSand.position.z;
      bunkerPos[i + 1] = getHeight(wx, wz) + 0.01;
    }
    bunkerSand.updateVerticesData(VertexBuffer.PositionKind, bunkerPos);
  }
  const bunkerMat = new StandardMaterial('bunkerMat', scene);
  bunkerMat.diffuseColor = new Color3(0.8, 0.71, 0.55);
  bunkerMat.specularColor = new Color3(0.08, 0.08, 0.08);
  bunkerSand.material = bunkerMat;

  const tee = MeshBuilder.CreateGround('tee', { width: 24, height: 9, subdivisions: 4 }, scene);
  tee.position = new Vector3(-2, 0.05, -145);
  const teePos = tee.getVerticesData(VertexBuffer.PositionKind);
  if (teePos) {
    for (let i = 0; i < teePos.length; i += 3) {
      const wx = teePos[i] + tee.position.x;
      const wz = teePos[i + 2] + tee.position.z;
      teePos[i + 1] = getHeight(wx, wz) + 0.07;
    }
    tee.updateVerticesData(VertexBuffer.PositionKind, teePos);
  }
  const teeMat = new PBRMaterial('teeMat', scene);
  teeMat.albedoColor = new Color3(0.36, 0.61, 0.31);
  teeMat.roughness = 0.85;
  tee.material = teeMat;

  const path = MeshBuilder.CreateRibbon('path', {
    pathArray: [
      [new Vector3(-42, 0, -170), new Vector3(-38, 0, -80), new Vector3(-34, 0, 0), new Vector3(-28, 0, 80)],
      [new Vector3(-35, 0, -170), new Vector3(-32, 0, -80), new Vector3(-27, 0, 0), new Vector3(-21, 0, 80)],
    ],
    sideOrientation: Mesh.DOUBLESIDE,
    updatable: true,
  }, scene);
  const pathPos = path.getVerticesData(VertexBuffer.PositionKind);
  if (pathPos) {
    for (let i = 0; i < pathPos.length; i += 3) {
      pathPos[i + 1] = getHeight(pathPos[i], pathPos[i + 2]) + 0.035;
    }
    path.updateVerticesData(VertexBuffer.PositionKind, pathPos);
  }
  const pathMat = new StandardMaterial('pathMat', scene);
  pathMat.diffuseColor = new Color3(0.47, 0.42, 0.35);
  pathMat.specularColor = new Color3(0.05, 0.05, 0.05);
  path.material = pathMat;

  const treeParent = new TransformNode('trees', scene);
  const trunkTemplate = MeshBuilder.CreateCylinder('trunkTemplate', { diameterTop: 0.48, diameterBottom: 0.72, height: 6.2 }, scene);
  const canopyTemplate = MeshBuilder.CreateSphere('canopyTemplate', { diameter: 5.5, segments: 4 }, scene);
  trunkTemplate.isVisible = false;
  canopyTemplate.isVisible = false;

  const treeMaterial = new StandardMaterial('trunkMat', scene);
  treeMaterial.diffuseColor = new Color3(0.39, 0.28, 0.2);
  trunkTemplate.material = treeMaterial;

  const canopyMaterial = new PBRMaterial('canopyMat', scene);
  canopyMaterial.albedoColor = new Color3(0.47, 0.63, 0.33);
  canopyMaterial.roughness = 0.95;
  canopyTemplate.material = canopyMaterial;

  const addTree = (x: number, z: number, scale = 1) => {
    const trunk = trunkTemplate.createInstance(`trunk-${x}-${z}`);
    const canopy = canopyTemplate.createInstance(`canopy-${x}-${z}`);
    trunk.parent = treeParent;
    canopy.parent = treeParent;
    trunk.scaling = new Vector3(scale, 0.9 + scale * 0.55, scale);
    const y = getHeight(x, z);
    trunk.position = new Vector3(x, y + (3.1 * trunk.scaling.y), z);
    canopy.scaling = new Vector3(0.95 + scale * 0.5, 1 + scale * 0.65, 0.95 + scale * 0.45);
    canopy.position = new Vector3(x + 0.2, trunk.position.y + (2.8 * scale), z);
  };

  for (let i = 0; i < 24; i += 1) {
    addTree(-65 + i * 2.9, -95 + (i % 4) * 24, 0.8 + (i % 5) * 0.08);
  }
  for (let i = 0; i < 18; i += 1) {
    addTree(55 + i * 3.5, -160 + (i % 6) * 11.5, 0.88 + (i % 4) * 0.13);
  }
  for (let i = 0; i < 16; i += 1) {
    addTree(-25 + i * 6.8, 185 + (i % 3) * 7, 1 + (i % 3) * 0.11);
  }

  const fenceMat = new StandardMaterial('fence', scene);
  fenceMat.diffuseColor = new Color3(0.93, 0.93, 0.93);
  fenceMat.specularColor = new Color3(0.11, 0.11, 0.11);

  for (let i = 0; i < 11; i += 1) {
    const railL = MeshBuilder.CreateBox(`fenceL-${i}`, { width: 0.22, depth: 2.6, height: 1 }, scene);
    railL.position = new Vector3(-15, getHeight(-15, -151 + i * 2.9) + 0.7, -151 + i * 2.9);
    railL.material = fenceMat;
    const railR = railL.clone(`fenceR-${i}`)!;
    railR.position.x = 11;
  }

  const pole = MeshBuilder.CreateCylinder('flagPole', { diameter: 0.18, height: 8 }, scene);
  pole.position = new Vector3(28, getHeight(28, 156) + 4.1, 156);
  const poleMat = new StandardMaterial('poleMat', scene);
  poleMat.diffuseColor = new Color3(0.92, 0.92, 0.92);
  pole.material = poleMat;

  const flag = MeshBuilder.CreatePlane('flag', { width: 2.1, height: 1.3 }, scene);
  flag.position = new Vector3(29.2, pole.position.y + 1.5, 156);
  const flagMat = new StandardMaterial('flagMat', scene);
  flagMat.diffuseColor = new Color3(0.76, 0.11, 0.1);
  flagMat.specularColor = new Color3(0.02, 0.02, 0.02);
  flag.material = flagMat;

  const views = new Map(sceneData.cameras.map((v) => [v.id, v]));
  const defaultView = views.get('overview') ?? sceneData.cameras[0];
  const animationFrameRate = 60;

  const animateToView = (view: CameraView, instant = false) => {
    const target = new Vector3(...view.target);
    if (instant || reduceMotion) {
      camera.alpha = view.alpha;
      camera.beta = view.beta;
      camera.radius = view.radius;
      camera.setTarget(target);
      return;
    }

    const alphaAnim = Animation.CreateAndStartAnimation('alphaAnim', camera, 'alpha', animationFrameRate, 25, camera.alpha, view.alpha, 0);
    const betaAnim = Animation.CreateAndStartAnimation('betaAnim', camera, 'beta', animationFrameRate, 25, camera.beta, view.beta, 0);
    const radiusAnim = Animation.CreateAndStartAnimation('radiusAnim', camera, 'radius', animationFrameRate, 25, camera.radius, view.radius, 0);
    const fromTarget = camera.target.clone();
    Animation.CreateAndStartAnimation('targetAnimX', fromTarget, 'x', animationFrameRate, 25, fromTarget.x, target.x, 0);
    Animation.CreateAndStartAnimation('targetAnimY', fromTarget, 'y', animationFrameRate, 25, fromTarget.y, target.y, 0);
    Animation.CreateAndStartAnimation('targetAnimZ', fromTarget, 'z', animationFrameRate, 25, fromTarget.z, target.z, 0);
    scene.onBeforeRenderObservable.addOnce(() => {
      camera.setTarget(target);
      alphaAnim?.stop();
      betaAnim?.stop();
      radiusAnim?.stop();
    });
  };

  animateToView(defaultView, true);

  const setQuality = (quality: QualityProfile) => {
    if (quality === 'tablet') {
      engine.setHardwareScalingLevel(Math.min(1.8, window.devicePixelRatio));
      sun.shadowEnabled = false;
    } else {
      engine.setHardwareScalingLevel(1);
      sun.shadowEnabled = true;
    }
  };

  let tourTimer: number | null = null;
  let tourIndex = 0;
  const tourOrder: ViewId[] = ['depart', 'fairway', 'green', 'overview'];

  const stopTour = () => {
    if (tourTimer !== null) {
      window.clearInterval(tourTimer);
      tourTimer = null;
    }
  };

  const startTour = () => {
    stopTour();
    if (reduceMotion) return;

    const apply = () => {
      const viewId = tourOrder[tourIndex % tourOrder.length];
      tourIndex += 1;
      const view = views.get(viewId);
      if (view) animateToView(view);
    };

    apply();
    tourTimer = window.setInterval(apply, 5000);
  };

  const setView = (viewId: ViewId) => {
    const view = views.get(viewId);
    if (view) animateToView(view);
  };

  setQuality(options.quality ?? 'high');

  if (options.autoStartTour && !reduceMotion) {
    startTour();
  }

  const onResize = () => engine.resize();
  window.addEventListener('resize', onResize);

  scene.metadata = {
    title: holeData.metadata.name,
    distance: holeData.metadata.distance_m.value,
    reconstruction: 'reconstitution estimée V1',
  };

  engine.runRenderLoop(() => scene.render());

  return {
    setView,
    startTour,
    stopTour,
    setQuality,
    dispose: () => {
      stopTour();
      window.removeEventListener('resize', onResize);
      scene.dispose();
      engine.dispose();
      canvas.remove();
    },
  };
}
