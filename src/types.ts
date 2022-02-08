import { Scene } from "obs-websocket-js";

export interface Props {
    scene: string;
    source: string;
    filter: string;
    action: string;
}

export interface SceneList {
    currentScene: string;
    scenes: Scene[];
}