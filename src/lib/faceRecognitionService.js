import { Human } from '@vladmandic/human';

const humanConfig = {
  modelBasePath: 'https://vladmandic.github.io/human/models/',
  cacheModels: true,
  debug: false,
  face: {
    enabled: true,
    detector: { rotation: true, return: true },
    mesh: { enabled: true },
    iris: { enabled: true },
    emotion: { enabled: false },
    description: { enabled: true },
  },
};

class HumanFaceService {
  constructor() {
    this.human = new Human(humanConfig);
    this.initialized = false;
    this.employeeDescriptors = new Map(); // employeeId -> Float32Array
  }

  async init() {
    if (!this.initialized) {
      console.log('🧠 Loading Human models...');
      await this.human.load();
      await this.human.warmup(); // warms up backend (WebGL/WASM/CPU)
      this.initialized = true;
      console.log('✅ Human initialized');
    }
  }

  // Extract descriptor (128D vector) from an image
  async extractDescriptor(image) {
    await this.init();
    const result = await this.human.detect(image);
    if (!result?.face?.length) throw new Error('No face detected');
    return result.face[0].embedding; // descriptor (Float32Array)
  }

  // Register employee face
  async registerEmployee(employeeId, imageUrl) {
    if (!imageUrl) {
      throw new Error('Profile picture URL is required');
    }
    
    await this.init();
    const img = await this.loadImage(imageUrl);
    const descriptor = await this.extractDescriptor(img);
    this.employeeDescriptors.set(employeeId, descriptor);
    console.log(`✅ Stored descriptor for employee ${employeeId}`);
  }

  // Calculate cosine similarity between two descriptors
  calculateSimilarity(descriptor1, descriptor2) {
    if (!descriptor1 || !descriptor2) {
      throw new Error('Both descriptors are required for similarity calculation');
    }

    if (descriptor1.length !== descriptor2.length) {
      throw new Error('Descriptor dimensions do not match');
    }

    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < descriptor1.length; i++) {
      dotProduct += descriptor1[i] * descriptor2[i];
      norm1 += descriptor1[i] * descriptor1[i];
      norm2 += descriptor2[i] * descriptor2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    const similarity = dotProduct / (norm1 * norm2);
    return similarity;
  }

  // Verify live camera frame against stored employee
  async verifyFace(employeeId, liveCanvas) {
    await this.init();
    const descriptor = this.employeeDescriptors.get(employeeId);
    if (!descriptor) throw new Error('Employee not registered');

    const result = await this.human.detect(liveCanvas);
    if (!result?.face?.length) return { success: false, message: 'No face detected' };

    const liveDescriptor = result.face[0].embedding;
    
    // Use our custom similarity calculation
    const similarity = this.calculateSimilarity(descriptor, liveDescriptor);
    
    // Cosine similarity ranges from -1 to 1, but for face recognition we expect positive values
    // Typically, values above 0.6 indicate a good match
    const matched = similarity > 0.6;
    
    return {
      success: true,
      matched,
      similarity, // renamed from 'distance' to be more accurate
      message: matched ? 'Face verified ✅' : 'Face mismatch ❌',
    };
  }

  // Helper to load image
  async loadImage(url) {
    return new Promise((resolve, reject) => {
      if (!url || typeof url !== 'string') {
        reject(new Error('Invalid image URL'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        reject(new Error('Image loading timeout'));
      }, 15000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };
      
      img.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Error loading image:', url, error);
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      try {
        if (url.includes('?')) {
          img.src = `${url}&_=${Date.now()}`;
        } else {
          img.src = `${url}?_=${Date.now()}`;
        }
      } catch (err) {
        reject(new Error(`Invalid image URL format: ${url}`));
      }
    });
  }

  // Check if employee is registered
  isEmployeeRegistered(employeeId) {
    return this.employeeDescriptors.has(employeeId);
  }

  // Utility method to test similarity calculation
  testSimilarity() {
    const test1 = new Float32Array([1, 0, 0]);
    const test2 = new Float32Array([1, 0, 0]);
    const similarity = this.calculateSimilarity(test1, test2);
    console.log('Similarity test (identical vectors):', similarity); // Should be 1.0
    return similarity === 1.0;
  }
}

const faceRecognitionService = new HumanFaceService();
export default faceRecognitionService;