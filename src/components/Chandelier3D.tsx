"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/** A drag-to-spin model of the golden "chandelier" fridge that cools superconducting quantum chips. */
export default function Chandelier3D({ accent = "#6fe6ff" }: { accent?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 0.2, 9);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.PointLight(accent, 30, 20);
    rim.position.set(-3, -2, 3);
    scene.add(rim);

    const gold = new THREE.MeshStandardMaterial({ color: 0xf2c14e, metalness: 0.45, roughness: 0.3 });
    const copper = new THREE.MeshStandardMaterial({ color: 0xe08a4a, metalness: 0.4, roughness: 0.4 });
    const rig = new THREE.Group();

    // Stacked plates, each one colder than the one above.
    const plates = [1.9, 1.6, 1.3, 1.05, 0.8];
    plates.forEach((r, k) => {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.12, 48), gold);
      plate.position.y = 2.2 - k * 1.05;
      rig.add(plate);
      if (k < plates.length - 1) {
        for (let p = 0; p < 6; p++) {
          const a = (p / 6) * Math.PI * 2;
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.05, 12), gold);
          rod.position.set(Math.cos(a) * r * 0.75, plate.position.y - 0.52, Math.sin(a) * r * 0.75);
          rig.add(rod);
        }
      }
    });

    // Coiled cables winding down the middle.
    const pts: THREE.Vector3[] = [];
    for (let t = 0; t <= 1; t += 0.005) pts.push(new THREE.Vector3(Math.cos(t * 40) * 0.45, 2.2 - t * 4.4, Math.sin(t * 40) * 0.45));
    rig.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.04, 8), copper));

    // The quantum chip at the very bottom — the coldest spot.
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.6), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.2 }));
    chip.position.y = -2.35;
    rig.add(chip);
    scene.add(rig);

    let vel = 0.008;
    let dragging = false;
    let lastX = 0;
    const down = (e: PointerEvent) => { dragging = true; lastX = e.clientX; el.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (!dragging) return; vel = (e.clientX - lastX) * 0.004; rig.rotation.y += vel; lastX = e.clientX; };
    const up = () => { dragging = false; };
    const turn = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      rig.rotation.y += event.key === "ArrowLeft" ? -0.2 : 0.2;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("lostpointercapture", up);
    el.addEventListener("blur", up);
    el.addEventListener("keydown", turn);
    const resize = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    });
    resize.observe(el);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const tick = (t: number) => {
      if (!dragging) {
        if (!reduce) rig.rotation.y += vel;
        vel += (0.006 - vel) * 0.02;
      }
      chip.material.emissiveIntensity = reduce ? 0.8 : 0.8 + Math.sin(t / 300) * 0.4;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("lostpointercapture", up);
      el.removeEventListener("blur", up);
      el.removeEventListener("keydown", turn);
      resize.disconnect();
      rig.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
      gold.dispose();
      copper.dispose();
      chip.material.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [accent]);

  return (
    <div
      ref={host}
      tabIndex={0}
      className="h-80 w-full max-w-sm cursor-grab touch-none bg-navy-ink active:cursor-grabbing"
      role="img"
      aria-label="3D model of a golden quantum computer fridge. Drag or use the left and right arrow keys to spin it."
    />
  );
}
