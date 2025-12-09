import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Props = { 
  power: number | null;
  onLand?: (distance: number) => void;
};

const ShotPutScene: React.FC<Props> = ({ power, onLand }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hammerRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const onLandRef = useRef(onLand);
  const characterRef = useRef<{ group: THREE.Group, rightArmGroup: THREE.Group, leftArmGroup: THREE.Group } | null>(null);

  // Update ref when prop changes
  useEffect(() => {
    onLandRef.current = onLand;
  }, [onLand]);
  
  // Physics state
  const physicsState = useRef({
    pos: new THREE.Vector3(0, 2, 0),
    vel: new THREE.Vector3(0, 0, 0),
    rotVel: new THREE.Vector3(0, 0, 0), // Rotation velocity for hammer in air
    isFlying: false,
    hasLanded: false,
    firstBounce: false,
    isAnimatingThrow: false,
    throwStartTime: 0,
    throwPower: 0,
    spinSpeed: 0
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 20, 100);

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 500);
    camera.position.set(-8, 5, 12); // Slightly further back
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // --- Lighting ---
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

    // --- Environment ---
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
          sprite.position.set(i, 1.5, -15); // Place label to the side
          lineGroup.add(sprite);
          
          // Add another one on the other side
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

    // Safety Cage (Hammer throw needs a cage!)
    const cageGroup = new THREE.Group();
    const cageMat = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true, transparent: true, opacity: 0.3 });
    // Back panels
    const backPanel = new THREE.Mesh(new THREE.PlaneGeometry(4, 5, 2, 2), cageMat);
    backPanel.position.set(-3, 2.5, 0);
    backPanel.rotation.y = Math.PI / 2;
    cageGroup.add(backPanel);
    // Side panels (angled)
    const sidePanel1 = new THREE.Mesh(new THREE.PlaneGeometry(4, 5, 2, 2), cageMat);
    sidePanel1.position.set(-2, 2.5, -2);
    sidePanel1.rotation.y = Math.PI / 4;
    cageGroup.add(sidePanel1);
    const sidePanel2 = new THREE.Mesh(new THREE.PlaneGeometry(4, 5, 2, 2), cageMat);
    sidePanel2.position.set(-2, 2.5, 2);
    sidePanel2.rotation.y = -Math.PI / 4;
    cageGroup.add(sidePanel2);
    scene.add(cageGroup);


    // Stadium Walls (Simple)
    const wallGeo = new THREE.CylinderGeometry(60, 60, 10, 64, 1, true, -Math.PI / 2, Math.PI);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x555555, side: THREE.DoubleSide });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = 5;
    wall.rotation.y = -Math.PI / 2;
    scene.add(wall);

    // --- Character (Mannequin) ---
    const createMannequin = () => {
      const group = new THREE.Group();
      
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa }); // Skin
      const shirtMat = new THREE.MeshStandardMaterial({ color: 0xd90429 }); // Red shirt
      const pantMat = new THREE.MeshStandardMaterial({ color: 0x003049 }); // Blue pants

      // Legs
      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.5, 0.35), pantMat);
      leftLeg.position.set(-0.25, 0.75, 0);
      leftLeg.castShadow = true;
      group.add(leftLeg);

      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.5, 0.35), pantMat);
      rightLeg.position.set(0.25, 0.75, 0);
      rightLeg.castShadow = true;
      group.add(rightLeg);

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.5), shirtMat);
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

      // Eyes
      const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
      
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.12, 0.05, 0.25); // Front face is +Z
      headGroup.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.12, 0.05, 0.25);
      headGroup.add(rightEye);

      // Mouth
      const mouthGeo = new THREE.BoxGeometry(0.2, 0.05, 0.05);
      const mouthMat = new THREE.MeshStandardMaterial({ color: 0x550000 });
      const mouth = new THREE.Mesh(mouthGeo, mouthMat);
      mouth.position.set(0, -0.15, 0.25);
      headGroup.add(mouth);

      // Arms Group (Both arms together for hammer throw)
      const leftArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.65, 2.7, 0);
      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), skinMat);
      leftArm.position.set(0, -0.6, 0);
      leftArm.castShadow = true;
      leftArmGroup.add(leftArm);
      group.add(leftArmGroup);

      const rightArmGroup = new THREE.Group();
      rightArmGroup.position.set(0.65, 2.7, 0);
      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), skinMat);
      rightArm.position.set(0, -0.6, 0);
      rightArm.castShadow = true;
      rightArmGroup.add(rightArm);
      group.add(rightArmGroup);

      return { group, rightArmGroup, leftArmGroup };
    };

    const mannequin = createMannequin();
    mannequin.group.position.set(0, 0, 0);
    // Initial pose for Hammer Throw (Arms extended forward/down)
    mannequin.group.rotation.y = Math.PI / 2; 
    mannequin.rightArmGroup.rotation.z = Math.PI / 4;
    mannequin.rightArmGroup.rotation.x = -Math.PI / 4;
    mannequin.leftArmGroup.rotation.z = -Math.PI / 4;
    mannequin.leftArmGroup.rotation.x = -Math.PI / 4;
    
    scene.add(mannequin.group);
    characterRef.current = mannequin;


    // --- Hammer ---
    const createHammer = () => {
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

    const hammer = createHammer();
    // Initial hammer position (hanging from hands roughly)
    hammer.position.set(0, 1.5, 0.8);
    scene.add(hammer);
    hammerRef.current = hammer;

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    const gravity = 9.8;

    const animate = () => {
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1); // Cap dt
      const now = clock.getElapsedTime();

      // Character Animation
      if (physicsState.current.isAnimatingThrow) {
         if (physicsState.current.throwStartTime === -1) {
             physicsState.current.throwStartTime = now;
         }
         const elapsed = now - physicsState.current.throwStartTime;
         const duration = 2.5; // Spin duration
         
         if (elapsed < duration) {
            // Spinning motion
            const spinProgress = elapsed / duration;
            // Accelerate spin
            const rotations = 3;
            const currentAngle = Math.PI / 2 - (spinProgress * spinProgress * rotations * Math.PI * 2);
            
            if (characterRef.current) {
               characterRef.current.group.rotation.y = currentAngle;
               
               // Arms extended and brought together
               characterRef.current.rightArmGroup.rotation.x = -Math.PI / 2.5;
               characterRef.current.leftArmGroup.rotation.x = -Math.PI / 2.5;
               // Rotate arms inward to meet in middle
               characterRef.current.rightArmGroup.rotation.z = 0.55; // ~32 deg inward
               characterRef.current.leftArmGroup.rotation.z = -0.55;

               // Hammer follows character
               if (hammerRef.current) {
                   // Calculate hand position (where arms meet)
                   // Shoulders at +/- 0.65. Arms 1.2 long.
                   // Hands meet at approx 1.02m forward from shoulder line.
                   // Shoulder line rotates with body.
                   const handRadius = 1.02; 
                   
                   // Hands position
                   const handX = Math.sin(currentAngle) * handRadius;
                   const handZ = Math.cos(currentAngle) * handRadius;
                   const handY = 2.0; // Approx height of hands

                   // Ball position (extended out by centrifugal force)
                   const wireLen = 1.2;
                   
                   // Direction from center to hands
                   const dirX = Math.sin(currentAngle);
                   const dirZ = Math.cos(currentAngle);
                   
                   // Ball is further out along this direction
                   const ballX = handX + dirX * wireLen;
                   const ballZ = handZ + dirZ * wireLen;
                   // Ball height - slightly lower than hands due to gravity/angle
                   const ballY = handY - 0.2; 

                   // Place Hammer at HANDS (Anchor)
                   hammerRef.current.position.set(handX, handY, handZ);
                   
                   // Rotate so Ball (local -Y) points to Ball Position
                   // Vector from Handle to Ball
                   const targetDir = new THREE.Vector3(ballX - handX, ballY - handY, ballZ - handZ).normalize();
                   // Local direction of Ball (Down)
                   const localDir = new THREE.Vector3(0, -1, 0);
                   
                   // Create quaternion to rotate localDir to targetDir
                   const q = new THREE.Quaternion();
                   q.setFromUnitVectors(localDir, targetDir);
                   hammerRef.current.rotation.setFromQuaternion(q);
               }
            }
         } else {
            // Release point
            if (!physicsState.current.isFlying && !physicsState.current.hasLanded) {
               physicsState.current.isAnimatingThrow = false;
               physicsState.current.isFlying = true;
               
               // Set initial velocity based on power
               const power = physicsState.current.throwPower;
               const angle = (40 * Math.PI) / 180;
               const vx = power * Math.cos(angle);
               const vy = power * Math.sin(angle);
               physicsState.current.vel.set(vx, vy, 0);
               
               // Add some rotation to the hammer itself
               physicsState.current.rotVel.set(Math.random() * 5, Math.random() * 5, Math.random() * 5);

               // Set start pos (release point)
               if (hammerRef.current) {
                   // Calculate actual ball position in world space
                   const ballWorldPos = hammerRef.current.localToWorld(new THREE.Vector3(0, -1.2, 0));
                   physicsState.current.pos.copy(ballWorldPos);
               }
            }
         }
      } else if (!physicsState.current.isFlying && !physicsState.current.hasLanded) {
         // Idle animation
         if (characterRef.current) {
            characterRef.current.group.position.y = Math.sin(now * 2) * 0.05; // Breathing
            characterRef.current.group.rotation.y = Math.PI / 2; // Reset rotation
            
            // Arms relaxed
            characterRef.current.rightArmGroup.rotation.x = -Math.PI / 6;
            characterRef.current.leftArmGroup.rotation.x = -Math.PI / 6;
         }
         // Hammer hanging
         if (hammerRef.current) {
             // Hands at side/front approx (0, 1.5, 0.5) relative to char?
             // Let's put ball on ground or hanging low
             // Anchor at hands (approx 0, 1.5, 0.5)
             hammerRef.current.position.set(0, 1.5, 0.5); 
             hammerRef.current.rotation.set(0, 0, 0);
             // Let it hang down? Default is Handle at 0, Ball at -1.2.
             // So just rotation 0 is fine (hanging straight down).
             // Maybe slight tilt
             hammerRef.current.rotation.x = 0.1;
         }
      }


      if (physicsState.current.isFlying) {
        const state = physicsState.current;
        
        // Apply gravity
        state.vel.y -= gravity * dt;
        
        // Update position
        state.pos.add(state.vel.clone().multiplyScalar(dt));

        // Ground collision
        if (state.pos.y <= 0.25) { // Ball radius approx
          state.pos.y = 0.25;
          
          // Bounce
          state.vel.y *= -0.3; // Heavy damping for hammer
          state.vel.x *= 0.5; // Heavy friction
          state.rotVel.multiplyScalar(0.5); // Slow down rotation
          
          // Stop condition
          if (Math.abs(state.vel.y) < 0.1 && Math.abs(state.vel.x) < 0.1) {
             state.isFlying = false;
             state.hasLanded = true;
             state.pos.y = 0.25; // Ensure it sits on ground
             state.vel.set(0, 0, 0);
             state.rotVel.set(0, 0, 0);
             
             // Lay flat on ground
             if (hammerRef.current) {
                 // We need to position the GROUP so the BALL is at state.pos
                 // Ball is at (0, -1.2, 0) local.
                 // If we want Ball at P.
                 // Group must be at P + (0, 1.2, 0) rotated?
                 // Easier: Just rotate group so it lies flat, and position it so ball matches.
                 
                 hammerRef.current.rotation.set(Math.PI / 2, 0, 0); // Flat on ground (Handle flat)
                 // If Handle is flat at (0,0,0), Ball is at (0, -1.2, 0) rotated...
                 // Wait, if RotX = 90. Y becomes Z. Z becomes -Y.
                 // (0, -1.2, 0) becomes (0, 0, 1.2) or something.
                 // Let's just set position based on visual.
                 
                 // Actually, let's just move the group to the ball position, 
                 // and offset it by the wire length in the direction of the handle.
                 // For simplicity, just place the ball at the spot.
                 
                 // Re-calculate group position from ball position
                 // If lying flat along X axis?
                 hammerRef.current.position.copy(state.pos);
                 hammerRef.current.position.z -= 1.2; // Handle is 1.2m away
                 hammerRef.current.rotation.set(-Math.PI / 2, 0, 0);
             }

             // Notify parent of the FINAL distance (when stopped)
             if (onLandRef.current) {
                onLandRef.current(state.pos.x);
             }
          }
        }

        if (hammerRef.current) {
          // During flight, we want the BALL to be at state.pos
          // The group origin is the Handle.
          
          // 1. Determine Rotation (Spinning in air)
          hammerRef.current.rotation.x += state.rotVel.x * dt;
          hammerRef.current.rotation.y += state.rotVel.y * dt;
          hammerRef.current.rotation.z += state.rotVel.z * dt;
          
          // 2. Calculate Offset of Ball in current rotation
          // Ball is at (0, -1.2, 0) in local space
          const ballOffset = new THREE.Vector3(0, -1.2, 0);
          ballOffset.applyEuler(hammerRef.current.rotation);
          
          // 3. Set Group Position so that Ball is at state.pos
          // GroupPos + BallOffset = StatePos
          // GroupPos = StatePos - BallOffset
          hammerRef.current.position.copy(state.pos).sub(ballOffset);
        }

        // Camera follow logic
        if (cameraRef.current) {
            // Keep camera behind and slightly above ball, but smooth it
            const idealCamPos = new THREE.Vector3(state.pos.x - 10, Math.max(state.pos.y + 5, 4), state.pos.z + 8);
            cameraRef.current.position.lerp(idealCamPos, 0.1);
            cameraRef.current.lookAt(state.pos);
        }
      } else if (!physicsState.current.hasLanded) {
          // Idle state - rotate around start
          if (cameraRef.current) {
             // Gentle idle movement
             const time = Date.now() * 0.0005;
             cameraRef.current.position.x = Math.sin(time) * 12;
             cameraRef.current.position.z = Math.cos(time) * 12;
             cameraRef.current.position.y = 6;
             cameraRef.current.lookAt(0, 1, 0);
          }
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- Resize Handler ---
    const handleResize = () => {
      if (!mount) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // --- Trigger Throw ---
  useEffect(() => {
    if (power !== null && power > 0) {
      // Start Throw Animation
      physicsState.current.isAnimatingThrow = true;
      physicsState.current.throwPower = power;
      physicsState.current.throwStartTime = -1; // Signal to reset in loop
      
      // Reset ball
      physicsState.current.pos.set(0, 2.5, 0);
      physicsState.current.hasLanded = false;
      physicsState.current.isFlying = false;
      physicsState.current.firstBounce = false;
      
    } else if (power === null) {
        // Reset
        physicsState.current.isFlying = false;
        physicsState.current.hasLanded = false;
        physicsState.current.isAnimatingThrow = false;
        physicsState.current.firstBounce = false;
        physicsState.current.pos.set(0, 2.5, 0);
        if (hammerRef.current) hammerRef.current.position.set(0, 2.5, 0);
    }
  }, [power]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default ShotPutScene;
