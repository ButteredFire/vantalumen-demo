import * as THREE from 'three';
import { GLTFLoader, DRACOLoader, KTX2Loader } from 'three-stdlib';

export class AssetStreamManager {
  private static instance: AssetStreamManager;
  public gltfLoader: GLTFLoader;
  public ktx2Loader: KTX2Loader;
  public dracoLoader: DRACOLoader;
  private isInitialized = false;

  private constructor() {
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/decoders/draco/');
    this.dracoLoader.setWorkerLimit(4); // Giải mã hình học trên 4 Web Workers

    this.ktx2Loader = new KTX2Loader();
    this.ktx2Loader.setTranscoderPath('/decoders/basis/');
    this.ktx2Loader.setWorkerLimit(4); // Transcode KTX2 sang BC7/ASTC trên Worker

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    this.gltfLoader.setKTX2Loader(this.ktx2Loader);
  }

  public static getInstance(): AssetStreamManager {
    if (!AssetStreamManager.instance) {
      AssetStreamManager.instance = new AssetStreamManager();
    }
    return AssetStreamManager.instance;
  }

  public initWithRenderer(renderer: THREE.WebGLRenderer): void {
    if (!this.isInitialized) {
      this.ktx2Loader.detectSupport(renderer);
      this.isInitialized = true;
    }
  }
}

export const assetManager = AssetStreamManager.getInstance();
