// var Bounds3 = require('./bounds3.js');
var MAX_ITEMS = 3, MAX_DEPTH = 16;
if(typeof(module) != 'undefined')
    module.exports = TreeNode;

function TreeNode(bounds) {
    this.bounds = bounds;
    this.q = []
    for(var i = 0; i < 8 ; i ++) {
        this.q[i] = null;
    }
    // this.sibIndex = null
    this.items = null;
    this.parent = null
}


TreeNode.prototype.getSubNode = function(cb) {
    var that = this
    var p = cb.position
    var bounds = this.bounds, quarter = bounds.half / 2;
    var quadIdx = 0; // assume NW
    if (p[0] > bounds.x) 
        quadIdx += 1; // nope, we are in E part
    
    if (p[1] > bounds.y) 
        quadIdx += 2; // Somewhere south.
    
    if (p[2] > bounds.z) 
        quadIdx += 4; // Somewhere far

    if(this.q[quadIdx] == null) {
        var fx = quadIdx & 1 ? 1 : -1,
            fy = quadIdx & 2 ? 1 : -1,
            fz = quadIdx & 4 ? 1 : -1
    
        var bounds = new Bounds3(
                        bounds.x + fx * quarter, 
                        bounds.y + fy * quarter, 
                        bounds.z + fz * quarter, 
                        quarter
                    )
        var child = new TreeNode(bounds)
        child.parent = that
        this.q[quadIdx] = child
    }
    
    return this.q[quadIdx]
}

TreeNode.prototype.insert = function insert(id, array, depth) {
    var isLeaf = this.isLeaf();
    var x = array[id].getX(),
        y = array[id].getY(),
        z = array[id].getZ(),
        mass = array[id].getMass();
    if (isLeaf) {
        // TODO: this memory could be recycled to avoid GC
        if (this.items === null) {
            this.items = {
                ids: [id],
                CoM: [x, y, z],// center of mass
                mass: mass
            };
        } else {
            var its = this.items
            its.ids.push(id);
            var mp = this.getCoMOf2Point(its.mass, its.CoM, mass, [x, y, z]);
            its.CoM = mp.p
            its.mass = mp.m
        }
        // turn to parent
        if (this.items.ids.length > MAX_ITEMS && depth < MAX_DEPTH) {
            // this.subdivide();
            for (var i = 0; i < this.items.ids.length; ++i) {
                var items_id = this.items.ids[i]
                var subNode = this.getSubNode(array[items_id])
                subNode.insert(items_id, array, depth + 1);
            }
            this.items.ids = [];
        }
    } else {
        var its = this.items
        var mp = this.getCoMOf2Point(its.mass, its.CoM, mass, [x, y, z]);
        its.CoM = mp.p
        its.mass = mp.m
        var subNode = this.getSubNode(array[id])
        subNode.insert(id, array, depth + 1);
    }
};

TreeNode.prototype.query = function queryBounds(results, sourceArray, intersects, preciseCheck) {
    if (!intersects(this.bounds)) return;
    var items = this.items;
    var needsCheck = typeof preciseCheck === 'function';
    if (items) {
        for (var i = 0; i < items.ids.length; ++i) {
            var id = items.ids[i];
            if (needsCheck) {
                if (preciseCheck(sourceArray[id].getX(), sourceArray[id].getY(), sourceArray[id].getZ())) {
                  results.push(id);
                }
            } else {
                results.push(id);
            }
        }
    }

    if (!this.q[0]) return;
    this.q.forEach(function(node) {
        node.query(results, sourceArray, intersects, preciseCheck);
    })
};

// 获取2点质心
TreeNode.prototype.getCoMOf2Point = function(m1, p1, m2, p2) {
    var m3 = m1 + m2, p3 = []
    p3[0] = ( m1 * p1[0] + m2 * p2[0] ) / m3
    p3[1] = ( m1 * p1[1] + m2 * p2[1] ) / m3
    p3[2] = ( m1 * p1[2] + m2 * p2[2] ) / m3
    return {
        m: m3,
        p: p3
    }
}

TreeNode.prototype.isLeaf = function() {
    for(var i = 0, l = this.q.length; i < l; i ++) {
        if(this.q[i] != null)
            return false
    }
    return true
}

TreeNode.prototype.subdivide = function subdivide() {
    var bounds = this.bounds;
    var quarter = bounds.half / 2;

    this.q[0] = new TreeNode(new Bounds3(bounds.x - quarter, bounds.y - quarter, bounds.z - quarter, quarter));
    this.q[1] = new TreeNode(new Bounds3(bounds.x + quarter, bounds.y - quarter, bounds.z - quarter, quarter));
    this.q[2] = new TreeNode(new Bounds3(bounds.x - quarter, bounds.y + quarter, bounds.z - quarter, quarter));
    this.q[3] = new TreeNode(new Bounds3(bounds.x + quarter, bounds.y + quarter, bounds.z - quarter, quarter));
    this.q[4] = new TreeNode(new Bounds3(bounds.x - quarter, bounds.y - quarter, bounds.z + quarter, quarter));
    this.q[5] = new TreeNode(new Bounds3(bounds.x + quarter, bounds.y - quarter, bounds.z + quarter, quarter));
    this.q[6] = new TreeNode(new Bounds3(bounds.x - quarter, bounds.y + quarter, bounds.z + quarter, quarter));
    this.q[7] = new TreeNode(new Bounds3(bounds.x + quarter, bounds.y + quarter, bounds.z + quarter, quarter));
};