/**
 * Lightweight, zero-allocation Behavior Tree engine for Enemy and Boss AI.
 */
export const NodeStatus = {
  SUCCESS: 1,
  FAILURE: 2,
  RUNNING: 3,
};

export class BTNode {
  tick(entity, state, blackboard) {
    return NodeStatus.FAILURE;
  }
}

/**
 * Composite: Selector (Fallback).
 * Ticks children in sequence until one returns SUCCESS or RUNNING.
 */
export class SelectorNode extends BTNode {
  constructor(children = []) {
    super();
    this.children = children;
  }

  tick(entity, state, bb) {
    for (let i = 0; i < this.children.length; i++) {
      const status = this.children[i].tick(entity, state, bb);
      if (status !== NodeStatus.FAILURE) {
        return status;
      }
    }
    return NodeStatus.FAILURE;
  }
}

/**
 * Composite: Sequence.
 * Ticks children in sequence until one returns FAILURE or RUNNING.
 */
export class SequenceNode extends BTNode {
  constructor(children = []) {
    super();
    this.children = children;
  }

  tick(entity, state, bb) {
    for (let i = 0; i < this.children.length; i++) {
      const status = this.children[i].tick(entity, state, bb);
      if (status !== NodeStatus.SUCCESS) {
        return status;
      }
    }
    return NodeStatus.SUCCESS;
  }
}

/**
 * Leaf: Action.
 * Executes an arbitrary function with (entity, state, blackboard).
 */
export class ActionNode extends BTNode {
  constructor(actionFn) {
    super();
    this.actionFn = actionFn;
  }

  tick(entity, state, bb) {
    return this.actionFn(entity, state, bb);
  }
}

/**
 * Leaf: Condition.
 * Evaluates a predicate. Returns SUCCESS if true, FAILURE if false.
 */
export class ConditionNode extends BTNode {
  constructor(predicateFn) {
    super();
    this.predicateFn = predicateFn;
  }

  tick(entity, state, bb) {
    return this.predicateFn(entity, state, bb) ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}

/**
 * Decorator: Inverter.
 * Inverts SUCCESS to FAILURE, and FAILURE to SUCCESS.
 */
export class InverterNode extends BTNode {
  constructor(child) {
    super();
    this.child = child;
  }

  tick(entity, state, bb) {
    const status = this.child.tick(entity, state, bb);
    if (status === NodeStatus.SUCCESS) return NodeStatus.FAILURE;
    if (status === NodeStatus.FAILURE) return NodeStatus.SUCCESS;
    return status;
  }
}

/**
 * Decorator: Cooldown.
 * Only allows execution if cooldown in blackboard has expired.
 */
export class CooldownNode extends BTNode {
  constructor(cooldownKey, duration, child) {
    super();
    this.key = cooldownKey;
    this.duration = duration;
    this.child = child;
  }

  tick(entity, state, bb) {
    const now = state.time || 0;
    const lastTime = bb[this.key] || -Infinity;
    if (now - lastTime < this.duration) {
      return NodeStatus.FAILURE;
    }
    const status = this.child.tick(entity, state, bb);
    if (status === NodeStatus.SUCCESS) {
      bb[this.key] = now;
    }
    return status;
  }
}
