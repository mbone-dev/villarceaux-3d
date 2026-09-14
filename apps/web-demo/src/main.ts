import holeData from '@courses/villarceaux/holes/hole-01/hole.json';
import sceneData from '@courses/villarceaux/holes/hole-01/scene/surfaces.json';
import cameraData from '@courses/villarceaux/holes/hole-01/scene/cameras.json';
import { mountHoleViewer, type ViewId } from '@villarceaux/viewer';

const container = document.getElementById('viewer');
const message = document.getElementById('message');
const status = document.getElementById('status');

if (!container || !message || !status) {
  throw new Error('DOM incomplet : impossible de démarrer le viewer.');
}

try {
  const allowedIds: ViewId[] = ['depart', 'fairway', 'green', 'overview'];
  const views = cameraData.views
    .filter((view): view is typeof view & { id: ViewId } => allowedIds.includes(view.id as ViewId))
    .map((view) => ({
      ...view,
      target: [view.target[0], view.target[1], view.target[2]] as [number, number, number],
    }));

  const api = mountHoleViewer({
    container,
    holeData,
    sceneData: {
      ...sceneData,
      cameras: views,
    },
    quality: 'high',
    autoStartTour: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });

  message.textContent = 'Scène V1 chargée. Reconstitution estimée, non métrique fine.';
  status.innerHTML = [
    `<strong>${holeData.metadata.name}</strong>`,
    `Version: ${holeData.metadata.version}`,
    `Provenance: ${holeData.metadata.provenance.summary}`,
    `Précision: ${holeData.metadata.precisionNotice}`,
    `Distance de référence: ${holeData.metadata.distance_m.value ?? 'inconnue'} m`,
  ].join('<br>');

  document.querySelectorAll<HTMLButtonElement>('button[data-view]').forEach((button) => {
    button.addEventListener('click', () => api.setView(button.dataset.view as ViewId));
  });

  document.getElementById('tour-start')?.addEventListener('click', () => api.startTour());
  document.getElementById('tour-stop')?.addEventListener('click', () => api.stopTour());
  document.getElementById('reset')?.addEventListener('click', () => api.setView('overview'));

  document.getElementById('quality')?.addEventListener('change', (event) => {
    const value = (event.target as HTMLSelectElement).value as 'tablet' | 'high';
    api.setQuality(value);
  });

  window.addEventListener('beforeunload', () => api.dispose(), { once: true });
} catch (error) {
  console.error(error);
  message.textContent = 'Erreur de chargement WebGL. Vérifiez que le navigateur supporte WebGL2 et la carte graphique active.';
}
