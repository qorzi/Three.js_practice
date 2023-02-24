import './App.css';
import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useDrag } from "@use-gesture/react";
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls, Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib'
import { KernelSize } from 'postprocessing'
import { Selection, Select, EffectComposer, Outline, Bloom, SelectiveBloom } from '@react-three/postprocessing'

extend({ UnrealBloomPass })

export default function App() {
  const [isDragging, setIsDragging] = useState(false);
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  return (
    <div className='Main'>
      <Canvas
        style={{ width: "100vw", height: "100vh" }}
        // shadowMap prop must be set to true on the Canvas. And
        // you must set castShadow to true on all lights casting shadows.
        shadowMap
        // camera={{near: 0.1, far: 1000, zoom: 100, position: [0, 40, 300]}}  
      >
        <Effects disableGamma>
        {/* threshhold has to be 1, so nothing at all gets bloom by default */}
          <unrealBloomPass threshold={1} strength={1.5} radius={0.5} />
        </Effects>

        <ambientLight intensity={1} />

        <directionalLight
          castShadow 
          intensity={0.5}
          position={[-1,0.5,1]}
          shadow-mapSize-height={512}
          shadow-mapSize-width={512}
        />

        {/* <spotLight
          castShadow
          intensity={2}
          args={[0xff0000, 2, 100]}
          position={[1, 2, 1]}
        />

        <spotLight
          castShadow
          intensity={2}
          args={["blue", 2, 100]}
          position={[-1, 2, 1]}
        /> */}

      <pointLight position={[10, 0, 20]} color="white" intensity={1} />
      <pointLight position={[0, 10, 0]} intensity={1} />

        <OrthographicCamera makeDefault zoom={50} position={[60, 60, 200]} />
        <OrbitControls minZoom={10} maxZoom={50} enabled={true} />

        <Selection>
          <EffectComposer multisampling={8} autoClear={false}>
            <Outline blur visibleEdgeColor="white" edgeStrength={100} width={500} />
            {/* <SelectiveBloom kernelSize={KernelSize.HUGE} luminanceThreshold={0} luminanceSmoothing={0.4} intensity={0.6}  /> */}
            {/* <Bloom kernelSize={3} luminanceThreshold={0} luminanceSmoothing={0.4} intensity={0.6} />
            <Bloom kernelSize={KernelSize.HUGE} luminanceThreshold={0} luminanceSmoothing={0} intensity={0.5} /> */}
          </EffectComposer>

          <MyBox isDragging={isDragging} setIsDragging={setIsDragging} floorPlane={floorPlane} />
          <Shape position={[1, 1, 0]} rotation={[-Math.PI / 2, 0, 0]} />
        </Selection>
        <mesh
          onPointerDown={console.log}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.1, 0]}
          receiveShadow
        >
          <planeBufferGeometry attach="geometry" args={[40, 40]} receiveShadow />
          <meshStandardMaterial attach="material" color="#ccc" side={THREE.DoubleSide} />
        </mesh>

        <planeHelper args={[floorPlane, 5, "red"]} />

        <gridHelper args={[100, 100]} />
        
      </Canvas>
    </div>
  );
}

const MyBox = ({isDragging, setIsDragging, floorPlane, ...props}) => {
  // const { viewport } = useThree()
  // viewport = canvas in 3d units (meters)

  const mesh = useRef()
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false);
  useFrame((state, delta) => (mesh.current.rotation.x = mesh.current.rotation.y += delta))
  let planeIntersectPoint = new THREE.Vector3();
  const [pos, setPos] = useState([0, 1, 0]);

  // 뷰포트 기준으로 드래그
  // useFrame(({ mouse }) => {
  //   const x = (mouse.x * viewport.width) / 2
  //   const y = (mouse.y * viewport.height) / 2
  //   mesh.current.position.set(x, y, 0)
  //   mesh.current.rotation.set(-y, x, 0)
  // })

  const bind = useDrag(
    ({ active, movement: [x, y], timeStamp, event }) => {
      if (active) {
        event.ray.intersectPlane(floorPlane, planeIntersectPoint);
        setPos([planeIntersectPoint.x, 0.65, planeIntersectPoint.z]);
      }

      setIsDragging(active);
    },
    { delay: true }
  );

  return (
    <Select enabled={hovered}>
      <mesh {...props}
      ref={mesh}
      scale={isDragging ? 1.3 : 1}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}
      rotation={[Math.PI / 6, 1, 0]}
      position={pos}
      {...bind()}
      castShadow
      receiveShadow
      >
        <dodecahedronBufferGeometry attach="geometry" args={[0.6, 0]} />
        {/* Now, in order to get selective bloom we simply crank colors out of
        their natural spectrum. Where colors are normally defined between 0 - 1 we push them
        way out of range, into a higher defintion (HDR). What previously was [1, 1, 1] now could
        for instance be [10, 10, 10]. This requires that toneMapping is off, or it clamps to 1 */}
        <meshStandardMaterial attach="material" color={hovered ? [3, 4, 0.5] : 'orange'} toneMapped={false} />
      </mesh>
    </Select>
  )
}

const Shape = ({...props }) => {
  const mesh = useRef()
  const [hovered, hover] = useState(false)
  // useFrame((state, delta) => (mesh.current.rotation.x = mesh.current.rotation.y += delta*2))
  return (
    <Select enabled={hovered}>
      <mesh {...props} 
      ref={mesh}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}
      castShadow
      receiveShadow
      >
        <boxGeometry attach="geometry" args={[1, 1, 1]} />
        {/* Now, in order to get selective bloom we simply crank colors out of
          their natural spectrum. Where colors are normally defined between 0 - 1 we push them
          way out of range, into a higher defintion (HDR). What previously was [1, 1, 1] now could
          for instance be [10, 10, 10]. This requires that toneMapping is off, or it clamps to 1 */}
        <meshStandardMaterial attach="material" color={hovered ? [3, 4, 0.5] : 'orange'} toneMapped={false} />
      </mesh>
    </Select>
  )
}

