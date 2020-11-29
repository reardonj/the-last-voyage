/* 
Portions copyright 2020, James Kemp.
Portions copyright 2020, Justin Reardon. 

This file is part of The Last Voyage.

The Last Voyage is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

The Last Voyage is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with The Last Voyage.  If not, see <https://www.gnu.org/licenses/>.
*/

import Preloader from "./Preloader";

export default class Boot extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "Boot";

  public create(): void {
    this.scene.start(Preloader.Name);
  }
}
