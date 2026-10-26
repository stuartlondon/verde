import cityCycling from '../assets/br1.jpg';
import sharedCycling from '../assets/br2.jpg';
import recycling from '../assets/br3.jpg';
import brazil from '../assets/br11.png';

export const projects = [
  {
    image: cityCycling,
    category: 'Move differently',
    title: 'The city on two wheels',
    description: 'A fresh perspective on familiar streets, with more room for people and greener journeys.',
    alt: 'Cyclists riding across a bridge beside trees and tall buildings in Sao Paulo',
    contain: false,
  },
  {
    image: sharedCycling,
    category: 'Everyday connections',
    title: 'Better journeys, together',
    description: 'Sharing the ride and discovering a different pace of life in the heart of the city.',
    alt: 'People sharing a tandem bicycle and cycling along an urban cycle lane',
    contain: false,
  },
  {
    image: recycling,
    category: 'Greener living',
    title: 'Thinking in circles',
    description: 'A visual look at recycling and the journey from everyday waste to useful materials.',
    alt: 'Portuguese-language recycling diagram showing collection, sorting, industry, and shops',
    contain: true,
  },
  {
    image: brazil,
    category: 'Shared roots',
    title: 'A connection with Brazil',
    description: 'Colour, culture, and a shared curiosity: the Brazilian thread running through Magazine Verde.',
    alt: 'Brazilian flag painted over a textured green wooden surface',
    contain: false,
  },
];
