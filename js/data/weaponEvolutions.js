export const weaponEvolutions = {
  fork: { id: 'forkStorm', name: 'Tenedor Tormenta', description: 'Una abanico de cubiertos corta todo el frente.', extraProjectiles: 2, spread: .78 },
  mustardSniper: { id: 'goldenMustard', name: 'Mostaza Dorada', description: 'Cada tercer tiro se convierte en un proyectil critico.', empoweredEvery: 3 },
  friesRain: { id: 'friesCyclone', name: 'Ciclon de Papitas', description: 'Duplica la lluvia y cubre un arco mucho mayor.', extraProjectiles: 4, spread: 1.18 },
  explosiveBread: { id: 'clusterBread', name: 'Pan de Racimo', description: 'La explosion libera seis migas incendiarias.', cluster: true, splashMultiplier: 1.5 },
  sauce: { id: 'infernoSauce', name: 'Salsa Infernal', description: 'Cada gota quema un area pequena y pega mas fuerte.', damageMultiplier: 1.3, splash: 22 },
  skewer: { id: 'returningSkewer', name: 'Brocheta Bumeran', description: 'La brocheta regresa atravesando enemigos otra vez.', boomerang: true, pierceBonus: 2 },
};

export function evolveWeapon(player) {
  if (player.level < 15 || player.weaponEvolution) return null;
  const evolution = weaponEvolutions[player.weapon.id];
  if (!evolution) return null;
  player.weaponEvolution = evolution;
  return evolution;
}
