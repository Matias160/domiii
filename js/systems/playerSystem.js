export function updatePlayer(state, delta, input, canvas) {
  state.player.update(delta, input, state.world || canvas);
}
