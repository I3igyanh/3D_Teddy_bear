import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import Slide from "./Slide";
import { Slides } from "../logic/slides";

const MAX_DUR = 4.0;
const FABRIC_TEXTURE_URL =
    "fabric_0008_color_2k.jpg";
// const WOOD_TEXTURE_URL = "WoodFloorAsh.jpg";
const BEAR_COLOR = 0xc4622d;   // warm brown — matches Material.001
const TEXTURE_REPEAT = 49;       // how many times the fabric tile repeats over the UV

export default function TeddyScene() {
    const sectionRef = useRef(null);
    const canvasRef = useRef(null);
    const stateRef = useRef({ smoothPct: 0, rawPct: 0, mixers: [], ready: false });
    const [loadPct, setLoadPct] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [scrollPct, setScrollPct] = useState(0);

    // ── scroll ───────────────────────────────────────────────────────────────
    useEffect(() => {
        const onScroll = () => {
            const el = sectionRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const total = el.offsetHeight - window.innerHeight;
            const pct = Math.max(0, Math.min(1, -rect.top / total));
            stateRef.current.rawPct = pct;
            setScrollPct(pct);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // ── three.js ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.6;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
        camera.position.set(0, 1.0, 6);
        camera.lookAt(0, 0, 0);

        // ── resize ────────────────────────────────────────────────────────────
        const resize = () => {
            const w = canvas.parentElement.clientWidth;
            const h = canvas.parentElement.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        resize();
        window.addEventListener("resize", resize);

        // ── lights (no env map needed) ────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0xffffff, 3.0));

        const key = new THREE.DirectionalLight(0xffffff, 5.0);
        key.position.set(5, 8, 6);
        scene.add(key);

        const fill = new THREE.DirectionalLight(0xddeeff, 2.0);
        fill.position.set(-6, 3, 2);
        scene.add(fill);

        const rim = new THREE.DirectionalLight(0xfff0cc, 2.5);
        rim.position.set(0, -5, -6);
        scene.add(rim);

        const rim2 = new THREE.DirectionalLight(0xffffff, 2.0);
        rim2.position.set(3, -2, 5);
        scene.add(rim2);


        // ── fabric texture ──────────────────────────────────────────────────
        const texLoader = new THREE.TextureLoader();
        const fabricTex = texLoader.load(FABRIC_TEXTURE_URL, (tex) => {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(TEXTURE_REPEAT, TEXTURE_REPEAT);

            // FIX: Modern Three.js uses colorSpace instead of encoding
            // This restores the rich brown tone under ACES filmic tone mapping
            tex.colorSpace = THREE.SRGBColorSpace;
        });

        // A subtle normal map fakes the bumpy knit surface
        const bumpTex = texLoader.load(FABRIC_TEXTURE_URL, (tex) => {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(TEXTURE_REPEAT, TEXTURE_REPEAT);

            // FIX: Data maps (bump, normal, roughness) MUST remain linear data maps!
            tex.colorSpace = THREE.NoColorSpace;
        });

        // ── load model ────────────────────────────────────────────────────────
        new GLTFLoader().load(
            "/teddy bear.glb",
            (gltf) => {
                const model = gltf.scene;

                // patch materials
                model.traverse((child) => {
                    if (!child.isMesh || !child.material) return;
                    const mat = child.material;

                    // Main bear body — apply fabric texture
                    if (mat.name === "Material.001") {
                        mat.map = fabricTex;
                        mat.color.set(BEAR_COLOR);  // tints the texture
                        mat.bumpMap = bumpTex;
                        mat.bumpScale = 0.04;
                        mat.roughness = 0.95;
                        mat.metalness = 0.0;
                        mat.needsUpdate = true;
                    }

                    // Eyes / nose (black matte)
                    if (mat.name === "Material.002") {
                        mat.color.set(0x111111);
                        mat.roughness = 0.5;
                        mat.needsUpdate = true;
                    }

                    // Shiny button/nose detail
                    if (mat.name === "Material.003") {
                        mat.color.set(0x222222);
                        mat.roughness = 0.05;
                        mat.metalness = 0.8;
                        mat.needsUpdate = true;
                    }
                });

                // center + scale
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const sc = 2.4 / Math.max(size.x, size.y, size.z);
                model.scale.setScalar(sc);
                model.position.copy(center.multiplyScalar(-sc));
                scene.add(model);

                // setup animation mixer — scrub all 4 clips via setTime
                const mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach((clip) => {
                    const action = mixer.clipAction(clip);
                    action.play();
                    action.paused = true;
                    action.time = 0;
                });
                stateRef.current.mixers = [mixer];
                stateRef.current.ready = true;
                setLoaded(true);
            },
            (xhr) => setLoadPct((xhr.loaded / (xhr.total || 1)) * 100)
        );

        // ── render loop ───────────────────────────────────────────────────────
        let raf;
        const loop = () => {
            raf = requestAnimationFrame(loop);
            const s = stateRef.current;
            s.smoothPct += (s.rawPct - s.smoothPct) * 0.06;
            const p = s.smoothPct;

            if (s.ready) {
                s.mixers.forEach((mx) => mx.setTime(p * MAX_DUR));

                // ── camera orbit config ──────────────────────
                const RADIUS = 5;   // distance from model
                const HEIGHT = 1.0; // camera height
                const SPINS = 3;   // full rotations during scroll (1 = 360°)
                const DIRECTION = 1;   // 1 = clockwise, -1 = counter-clockwise
                // ─────────────────────────────────────────────

                const angle = DIRECTION * p * Math.PI * 2 * SPINS;
                camera.position.set(
                    Math.sin(angle) * RADIUS,
                    HEIGHT,
                    Math.cos(angle) * RADIUS
                );
                camera.lookAt(0, 0, 0);
            }
            renderer.render(scene, camera);
        };
        loop();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
            renderer.dispose();
        };
    }, []);



    return (
        <div ref={sectionRef} className="relative" style={{ height: "500vh" }}>

            {/* Loading overlay */}
            {!loaded && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#080808]">
                    <p className="text-[0.65rem] tracking-[0.22em] uppercase text-neutral-500">
                        Loading model
                    </p>
                    <div className="w-44 h-px bg-neutral-800">
                        <div
                            className="h-full bg-[#d4b896] transition-all duration-300"
                            style={{ width: `${loadPct}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Sticky canvas */}
            <div className="sticky top-0 h-screen w-full overflow-hidden">
                <canvas ref={canvasRef} className="block w-full h-full" />

                {/* ── text slides ── */}
                {loaded && Slides.map((slide, i) => (
                    <Slide key={i} slide={slide} scrollPct={scrollPct} />
                ))}


                {/* Progress bar */}
                <div
                    className="absolute top-0 left-0 h-px bg-[#d4b896] transition-[width] duration-100"
                    style={{ width: `${scrollPct * 100}%` }}
                />
            </div>
        </div>
    );
}