/* *
 * Lambert Conformal Conic projection
 * */

'use strict';
import type {
    LonLatArray,
    MapBounds,
    ProjectedXYArray
} from '../MapViewOptions';
import type ProjectionDefinition from '../ProjectionDefinition';
import type ProjectionOptions from '../ProjectionOptions';

const sign = (Math as any).sign ||
    ((n: number): number => (n === 0 ? 0 : n > 0 ? 1 : -1)),
    scale = 63.78137,
    deg2rad = Math.PI / 180,
    halfPI = Math.PI / 2,
    eps10 = 1e-6,
    tany = (y: number): number => Math.tan((halfPI + y) / 2);

class LambertConformalConic implements ProjectionDefinition {

    private c: number;
    private n: number;
    private projectedBounds: MapBounds|undefined;

    constructor(options: ProjectionOptions) {
        const parallels = (options.parallels || [])
                .map((n): number => n * deg2rad),
            lat1 = parallels[0] || 0,
            lat2 = parallels[1] ?? lat1,
            cosLat1 = Math.cos(lat1);

        if (typeof options.projectedBounds === 'object') {
            this.projectedBounds = options.projectedBounds;
        }

        // Apply the global variables
        let n = lat1 === lat2 ?
            Math.sin(lat1) :
            Math.log(
                cosLat1 / Math.cos(lat2)
            ) / Math.log(tany(lat2) / tany(lat1));
        if (Math.abs(n) < 1e-10) {
            n = (sign(n) || 1) * 1e-10;
        }

        this.n = n;
        this.c = cosLat1 * Math.pow(tany(lat1), n) / n;

    }

    forward(lonLat: LonLatArray): ProjectedXYArray {
        const lon = lonLat[0] * deg2rad,
            { c, n, projectedBounds } = this;
        let lat = lonLat[1] * deg2rad;
        if (c > 0) {
            if (lat < -halfPI + eps10) {
                lat = -halfPI + eps10;
            }
        } else {
            if (lat > halfPI - eps10) {
                lat = halfPI - eps10;
            }
        }
        const r = c / Math.pow(tany(lat), n),
            x = r * Math.sin(n * lon) * scale,
            y = (c - r * Math.cos(n * lon)) * scale,
            xy: ProjectedXYArray = [x, y];

        if (
            projectedBounds && (
                x < projectedBounds.x1 ||
                x > projectedBounds.x2 ||
                y < projectedBounds.y1 ||
                y > projectedBounds.y2
            )
        ) {
            xy.outside = true;
        }
        return xy;
    }

    inverse(xy: ProjectedXYArray): LonLatArray {
        const x = xy[0] / scale,
            y = xy[1] / scale,
            { c, n } = this,
            cy = c - y,
            rho = sign(n) * Math.sqrt(x * x + cy * cy);

        let l = Math.atan2(x, Math.abs(cy)) * sign(cy);
        if (cy * n < 0) {
            l -= Math.PI * sign(x) * sign(cy);
        }
        return [
            (l / n) / deg2rad,
            (2 * Math.atan(Math.pow(c / rho, 1 / n)) - halfPI) / deg2rad
        ];
    }
}

export default LambertConformalConic;
