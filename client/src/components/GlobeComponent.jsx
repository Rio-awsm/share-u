import React, { useEffect, useRef } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";

const GlobeComponent = () => {
  const globeEl = useRef();

  useEffect(() => {
    const globeControls = globeEl.current.controls();
    if (globeControls) {
      globeControls.autoRotate = true;
      globeControls.autoRotateSpeed = 1.5;

      globeControls.enableZoom = false;
      globeControls.enablePan = false;
      globeControls.enableDamping = true;
      globeControls.dampingFactor = 0.05;
      globeControls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        RIGHT: THREE.MOUSE.NONE,
        MIDDLE: THREE.MOUSE.DOLLY,
      };
      globeControls.zoomSpeed = 1;
    }

    globeEl.current.renderer().setClearColor("#000000");
  }, []);

  // Pinpoints data
  const pins = [
    { lat: 37.7749, lng: -122.4194, size: 0.02, color: "red" }, // San Francisco
    { lat: 48.8566, lng: 2.3522, size: 0.02, color: "blue" }, // Paris
    { lat: -33.8688, lng: 151.2093, size: 0.02, color: "yellow" }, // Sydney
    { lat: 28.6139, lng: 77.209, size: 0.02, color: "green" }, // New Delhi
    { lat: 55.7558, lng: 37.6173, size: 0.02, color: "purple" }, // Moscow
  ];

  // Curves between the pins
  const arcs = [
    { startLat: 37.7749, startLng: -122.4194, endLat: 48.8566, endLng: 2.3522, color: ["red", "blue"] },
    { startLat: 48.8566, startLng: 2.3522, endLat: -33.8688, endLng: 151.2093, color: ["blue", "yellow"] },
    { startLat: -33.8688, startLng: 151.2093, endLat: 28.6139, endLng: 77.209, color: ["yellow", "green"] },
    { startLat: 28.6139, startLng: 77.209, endLat: 55.7558, endLng: 37.6173, color: ["green", "purple"] },
    { startLat: 55.7558, startLng: 37.6173, endLat: 37.7749, endLng: -122.4194, color: ["purple", "red"] },
  ];

  // Set globe dimensions
  const getGlobeDimensions = () => {
    const width = window.innerWidth;
    if (width < 640) return { width: 300, height: 300 }; // Mobile
    return { width: 550, height: 550 }; // Desktop
  };

  const { width, height } = getGlobeDimensions();

  return (
    <div className="flex flex-col bg-black items-center">
      <div className="flex justify-center  items-center ">
        <Globe
          ref={globeEl}
          width={width}
          height={height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          pointsData={pins}
          pointAltitude={(d) => d.size}
          pointColor={(d) => d.color}
          arcsData={arcs}
          arcColor={(d) => d.color}
          arcDashLength={0.5}
          arcDashGap={1}
          arcDashAnimateTime={2000}
          pointLabel={(d) => `(${d.lat.toFixed(2)}, ${d.lng.toFixed(2)})`}
        />
      </div>
    </div>
  );
};

export default GlobeComponent;
