export function validateGraph(scenes, start) {
  if (!scenes[start]) throw new Error('Missing start scene');
  for (const [id, scene] of Object.entries(scenes)) {
    if (scene.id !== id) throw new Error(`Scene ID mismatch: ${id}`);
    for (const target of [scene.left, scene.right, scene.forward, ...(scene.hotspots ?? []).map(h => h.target)]) {
      if (target && !scenes[target]) throw new Error(`Broken scene link: ${id} → ${target}`);
    }
  }
}
export function createNavigator(scenes, start) {
  validateGraph(scenes, start);
  let current = start, history = [];
  const visited = new Set([start]);
  function go(target) {
    if (!scenes[target] || target === current) return false;
    history.push(current); current = target; visited.add(current); return true;
  }
  return {
    get current() { return scenes[current]; },
    get visited() { return new Set(visited); },
    get canBack() { return history.length > 0; },
    go,
    move(action) {
      if (action === 'back') {
        if (!history.length) return false;
        current = history.pop(); visited.add(current); return true;
      }
      if (!['left','right','forward'].includes(action)) return false;
      return go(scenes[current][action]);
    },
    reset() { current = start; history = []; visited.clear(); visited.add(start); },
  };
}
