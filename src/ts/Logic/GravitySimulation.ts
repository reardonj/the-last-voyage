import { Math as M } from 'phaser';

export class GravitySimulation {
  private static grav = 20;
  readonly wells: GravityWell[];

  constructor(wells: GravityWell[]) {
    this.wells = [...wells];
  }

  calculate(seconds: number, resolution: number, position: M.Vector2, velocity: M.Vector2): [pos: M.Vector2, vel: M.Vector2][] {
    const result: [M.Vector2, M.Vector2][] = [];
    const delta = 1 / resolution;

    let acc = new M.Vector2();
    let vel = velocity;
    let pos = position;

    const tempPos = new M.Vector2();

    result.push([pos, vel]);

    for (var i: number = 0; i < seconds * resolution; i++) {
      const newPos = tempPos.copy(pos).add(vel.clone().scale(delta).add(acc.clone().scale(delta * delta * 0.5)));
      const newAcc = this.applyGravity(pos);
      vel.add(acc.add(newAcc).scale(delta * 0.5));
      pos = newPos.clone();
      acc = newAcc;
      result.push([pos, vel.clone()]);
    }
    return result;
  }

  private applyGravity(position: M.Vector2): M.Vector2 {
    let acc = new M.Vector2();
    for(let body of this.wells) {
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
