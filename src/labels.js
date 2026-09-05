import * as THREE from 'three';

// 3D geometry is useless if you cannot read it. Labels are real DOM nodes
// anchored to Object3D children of the scene graph: crisp at any DPR,
// selectable, themed by the page's CSS — and because the anchor lives in the
// same graph as the geometry, the label can never disagree with what renders.
export function createLabelLayer() {
  const layer = document.createElement('div');
  layer.className = 'label-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  let items = [];
  const v = new THREE.Vector3();

  return {
    // `parent` is the group the label belongs to; `local` its position within it.
    add(text, local, variant = '', parent = null) {
      const el = document.createElement('span');
      el.className = 'lbl' + (variant ? ' lbl-' + variant : '');
      el.textContent = text;
      layer.appendChild(el);

      const anchor = new THREE.Object3D();
      anchor.position.copy(local);
      if (parent) parent.add(anchor);

      const item = { el, anchor, visible: true };
      items.push(item);
      return item;
    },

    // `rect` is the slot the renderer scissors to. Projecting against the
    // whole canvas instead scatters labels across the copy, because the
    // render only ever fills that rectangle.
    update(camera, rect) {
      if (!rect) return;
      const w = rect.width, h = rect.height;
      if (!w || !h) return;
      for (const it of items) {
        it.anchor.getWorldPosition(v);
        const depth = v.distanceTo(camera.position);
        v.project(camera);
        const x = rect.left + (v.x * 0.5 + 0.5) * w;
        const y = rect.top + (-v.y * 0.5 + 0.5) * h;
        // Clipped to the slot, with a small margin so edge labels still show.
        const visible = it.visible && depth > 0.5 && v.z < 1
          && x > rect.left - 60 && x < rect.left + w + 60
          && y > rect.top - 30 && y < rect.top + h + 30;
        if (visible) {
          it.el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
        }
        it.el.style.opacity = visible ? '1' : '0';
      }
    },

    setOpacity(o) { layer.style.opacity = String(o); },

    clear() {
      items.forEach(i => { i.el.remove(); i.anchor.parent?.remove(i.anchor); });
      items = [];
    },

    destroy() { this.clear(); layer.remove(); },
  };
}
