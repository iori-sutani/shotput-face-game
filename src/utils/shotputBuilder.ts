import * as THREE from 'three';

// --- Lighting ---
export const setupLighting = (scene: THREE.Scene) => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(-10, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 50;
  dirLight.shadow.camera.bottom = -50;
  dirLight.shadow.camera.left = -50;
  dirLight.shadow.camera.right = 50;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);
};

// --- Environment (Ground, Walls, Cage, Lines) ---
export const setupEnvironment = (scene: THREE.Scene) => {
  // Ground (Grass)
  const groundGeo = new THREE.PlaneGeometry(200, 100);
  const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0x3b7d3b,
    roughness: 0.8,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Helper to create text sprite
  const createTextSprite = (text: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    canvas.width = 256;
    canvas.height = 128;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4, 2, 1);
    return sprite;
  };

  // Distance Lines
  const lineGroup = new THREE.Group();
  for (let i = 5; i <= 100; i += 5) {
    const isMajor = i % 10 === 0;
    const lineWidth = isMajor ? 0.3 : 0.1;
    const lineOpacity = isMajor ? 0.8 : 0.4;
    
    const lineGeo = new THREE.PlaneGeometry(lineWidth, 50);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: lineOpacity, transparent: true });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = Math.PI / 2;
    line.position.set(i, 0.02, 0);
    lineGroup.add(line);

    if (isMajor) {
      const sprite = createTextSprite(`${i}m`);
      if (sprite) {
        sprite.position.set(i, 1.5, -15);
        lineGroup.add(sprite);
        
        const sprite2 = sprite.clone();
        sprite2.position.set(i, 1.5, 15);
        lineGroup.add(sprite2);
      }
    }
  }
  scene.add(lineGroup);

  // Throwing Circle
  const circleGeo = new THREE.RingGeometry(1.0, 1.1, 32);
  const circleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const circle = new THREE.Mesh(circleGeo, circleMat);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.01;
  scene.add(circle);

  // Safety Cage
  const cageGroup = new THREE.Group();
  const cageMat = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true, transparent: true, opacity: 0.3 });
  const backPanel = new THREE.Mesh(new THREE.PlaneGeometry(4, 5, 2, 2), cageMat);
  backPanel.position.set(-3, 2.5, 0);
  backPanel.rotation.y = Math.PI / 2;
  cageGroup.add(backPanel);
  
  const sidePanel1 = new THREE.Mesh(new THREE.PlaneGeometry(4, 5, 2, 2), cageMat);
  sidePanel1.position.set(-2, 2.5, -2);
  sidePanel1.rotation.y = Math.PI / 4;
  cageGroup.add(sidePanel1);
  
  const sidePanel2 = new THREE.Mesh(new THREE.PlaneGeometry(4, 5, 2, 2), cageMat);
  sidePanel2.position.set(-2, 2.5, 2);
  sidePanel2.rotation.y = -Math.PI / 4;
  cageGroup.add(sidePanel2);
  scene.add(cageGroup);

  // Stadium Walls
  const wallGeo = new THREE.CylinderGeometry(60, 60, 10, 64, 1, true, -Math.PI / 2, Math.PI);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x555555, side: THREE.DoubleSide });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.y = 5;
  wall.rotation.y = -Math.PI / 2;
  scene.add(wall);
};

// --- Character (Mannequin) ---
export const createMannequin = () => {
  const group = new THREE.Group();
  
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd2a679 }); // Slightly tanned skin
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xd90429 }); // Red shirt
  const pantMat = new THREE.MeshStandardMaterial({ color: 0x111111 }); // Black pants (Murofushi style)

  // Legs (Thicker)
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.5, 0.45), pantMat);
  leftLeg.position.set(-0.3, 0.75, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.5, 0.45), pantMat);
  rightLeg.position.set(0.3, 0.75, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Torso (Broader)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.6), shirtMat);
  torso.position.set(0, 2.15, 0);
  torso.castShadow = true;
  group.add(torso);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 3.1, 0);
  group.add(headGroup);

  // Head Mesh
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Hair (Black, short)
  const hairGeo = new THREE.BoxGeometry(0.52, 0.15, 0.52);
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 0.3, 0); // Top of head
  headGroup.add(hair);

  // Eyes
  const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.12, 0.05, 0.25); // Front face is +Z
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.12, 0.05, 0.25);
  headGroup.add(rightEye);

  // Mouth (Shouting expression)
  const mouthGeo = new THREE.BoxGeometry(0.2, 0.1, 0.05);
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x550000 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.15, 0.25);
  headGroup.add(mouth);

  // Arms Group (Both arms together for hammer throw)
  // Adjusted position for broader shoulders
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.75, 2.7, 0); // Moved out
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), skinMat); // Thicker
  leftArm.position.set(0, -0.6, 0);
  leftArm.castShadow = true;
  leftArmGroup.add(leftArm);
  group.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.75, 2.7, 0); // Moved out
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), skinMat); // Thicker
  rightArm.position.set(0, -0.6, 0);
  rightArm.castShadow = true;
  rightArmGroup.add(rightArm);
  group.add(rightArmGroup);

  return { group, rightArmGroup, leftArmGroup };
};

// --- Hammer ---
export const createHammer = () => {
    const group = new THREE.Group();
    
    // Handle - CENTERED at 0,0,0 (Anchor point)
    const handleGeo = new THREE.TorusGeometry(0.1, 0.02, 8, 16);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0, 0);
    group.add(handle);

    // Wire - Goes DOWN to ball
    const wireLen = 1.2;
    const wireGeo = new THREE.CylinderGeometry(0.01, 0.01, wireLen, 8);
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.set(0, -wireLen / 2, 0); 
    wire.castShadow = true;
    group.add(wire);

    // Head (Ball) - At end of wire
    const ballGeo = new THREE.SphereGeometry(0.25, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.castShadow = true;
    ball.position.set(0, -wireLen, 0); 
    group.add(ball);

    return group;
};