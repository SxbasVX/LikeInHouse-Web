// Foto por defecto del inicio cuando el panel no tiene una cargada (Machu Picchu).
export const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1920&q=80";

// Web familiar: fotos por defecto de "Pensado para viajar en familia" mientras el panel no tenga
// las suyas. Son de Pexels (licencia libre para uso comercial, sin atribución obligatoria) y se usan
// sólo como ilustración: nunca en secciones que muestran familias reales (carrusel, polaroid).
const pexels = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

export const FAMILY_DEFAULT_CARD_IMAGES = {
  kids: pexels(1157386), // Viajes a su ritmo: papá caminando con su hijo frente a las montañas
  teens: pexels(1157399), // Edades claras: mamá con sus hijos pequeños frente a un lago
  parents: pexels(7669142), // Todo organizado: familia relajada en un picnic
  grandparents: pexels(15878741), // Recuerdos para todos: familia en un mirador entre nubes
} as const;
