import { Math as M } from 'phaser';

export class GravitySimulation {
  private static grav = 20;
  readonly wells: GravityWell[];

  constructor(wells: GravityWell[]) {
    this.wells = [...wells];
  }

  *calculate(
    deltaMs: number, 
    extraSteps: number, 
    position: M.Vector2, 
    velocity: M.Vector2,
    initialAcc: M.Vector2)
    : IterableIterator<[pos: M.Vector2, vel: M.Vector2, acc: M.Vector2]> {
    const delta = deltaMs / 1000 / extraSteps;

    let acc = initialAcc;
    let vel = velocity;
    let pos = position;
    let step = 0;


    while (true) {
      step = (step + 1) % extraSteps;
      const newPos = pos.clone().add(vel.clone().scale(delta).add(acc.clone().scale(delta * delta * 0.5)));
      const newAcc = this.applyGravity(pos).add(initialAcc);
      vel.add(acc.add(newAcc).scale(delta * 0.5));
      pos = newPos;
      acc = newAcc;

      if (step == 0) {
        initialAcc = M.Vector2.ZERO;
        yield [pos, vel.clone(), acc.clone()];
      }
    }
  }

  private applyGravity(position: M.Vector2): M.Vector2 {
    let acc = new M.Vector2();
    for (let body of this.wells) {
      const distSqr = body.position.distanceSq(position);
      const force = GravitySimulation.grav * body.mass / distSqr;
      acc.add(body.position.clone().subtract(position).normalize().scale(force));
    }

    return acc;
  }
}

export class GravityWell {
  readonly position: M.Vector2;
  readonly mass: number;

  constructor(position: M.Vector2, mass: number) {
    this.position = position;
    this.mass = mass;
  }
}
