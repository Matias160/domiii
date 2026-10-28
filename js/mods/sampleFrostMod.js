/**
 * Sample Mod: Frostbite Pack (Paquete Helado)
 * Demonstrates how external developers can add weapons, abilities, and event listeners.
 */
export const FrostbiteMod = {
  id: 'frostbite-pack',
  name: 'Frostbite Pack (Paquete Helado)',
  version: '1.0.0',
  author: 'Domiii Modding Community',

  init({ registry, events }) {
    // 1. Registrar una nueva arma helada
    registry.registerWeapon('iceFork', {
      id: 'iceFork',
      name: 'Tenedor de Hielo',
      description: 'Lanza carámbanos afilados que congelan y ralentizan enemigos.',
      damage: 28,
      projectileSpeed: 520,
      fireRate: 0.38,
      projectileCount: 2,
      projectileSize: 14,
      pierce: 1,
      splash: 35,
      color: '#70e4ff'
    });

    // 2. Registrar una habilidad pasiva/activa nueva
    registry.registerAbility('frostArmor', {
      id: 'frostArmor',
      name: 'Armadura Escarchada',
      category: 'Defensa',
      rarity: 'epic',
      description: 'Al recibir daño, desata una onda gélida que congela a todos los enemigos cercanos.',
      maxStacks: 2,
      apply: (player) => {
        player.defense = (player.defense || 1) * 1.25;
        player.hasFrostArmor = true;
      }
    });

    // 3. Hook al evento de daño recibido por el jugador
    events.on('onPlayerDamage', ({ player, state }) => {
      if (player?.hasFrostArmor && state) {
        state.rings?.push({
          x: player.x,
          y: player.y,
          radius: 160,
          life: 0.6,
          maxLife: 0.6,
          color: '#70e4ff'
        });
        state.floaters?.push({
          x: player.x,
          y: player.y - 40,
          text: '¡ONDA HELADA!',
          life: 1.0,
          color: '#70e4ff',
          scale: 1.2
        });

        // Ralentizar enemigos en el área
        for (const enemy of state.enemies) {
          if (enemy.hp > 0 && Math.hypot(enemy.x - player.x, enemy.y - player.y) < 160) {
            // Congelado 2.5 s de tiempo de juego (respeta la pausa); game.js aplica el frenado cada cuadro
            enemy.frozenUntil = (state.time || 0) + 2.5;
          }
        }
      }
    });

    // 4. Hook para enriquecer muertes con escarcha
    events.on('onEnemyKilled', ({ enemy, state }) => {
      if (state && Math.random() < 0.2) {
        state.rings?.push({
          x: enemy.x,
          y: enemy.y,
          radius: 40,
          life: 0.3,
          maxLife: 0.3,
          color: '#b0f5ff'
        });
      }
    });

    console.log('[FrostbiteMod] Mod initialized successfully.');
  }
};

export default FrostbiteMod;
