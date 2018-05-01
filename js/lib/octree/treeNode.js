// var Bounds3 = require('./bounds3.js');
var MAX_ITEMS = 4;
if(typeof(module) != 'undefined')
  module.exports = TreeNode;

function TreeNode(bounds) {
  this.bounds = bounds;
  this.q = []
  for(var i = 0; i < 8 ; i ++) {
    this.q[i] = null
  }
  this.items = null;
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

TreeNode.prototype.insert = function insert(id, array, depth) {
  var isLeaf = this.q[0] == null;
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
      its.CoM = mp.m
      its.mass = mp.p
    }
    if (this.items.ids.length >= MAX_ITEMS && depth < 16) {
      this.subdivide();
      for (var i = 0; i < this.items.ids.length; ++i) {
        this.insert(this.items.ids[i], array, depth + 1);
      }
      this.items = null;
    }
  } else {
    
    var bounds = this.bounds;
    var quadIdx = 0; // assume NW
    if (x > bounds.x) {
      quadIdx += 1; // nope, we are in E part
    }
    if (y > bounds.y) {
      quadIdx += 2; // Somewhere south.
    }
    if (z > bounds.z) {
      quadIdx += 4; // Somewhere far
    }

    var child = this.q[quadIdx];
    child.insert(id, array, depth + 1);
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
// 2点质心
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
