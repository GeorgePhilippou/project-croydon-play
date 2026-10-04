// Stateful room paintings keep movable clutter grounded in each camera view.
export function sceneBackground(scene,opened){
 return scene.revealedBackground&&opened.has(scene.revealedBackground.when)?scene.revealedBackground.image:scene.background;
}
export function backgroundAssets(scene){return [scene.background,scene.revealedBackground?.image].filter(Boolean);}
