#define nodesNum 73
#define MAXLEVEL 5
#define MAX_STACK_SIZE 8
#define BH_THETA 1.0
#define G 6.67e-1
// #define c 0// current node index
// global varies
int lastLevelIndex = 9;
const float NLEAF = 1.0;
const float NNODE = 0.0;
const float NNULL = -1.0;
const float maxSib = 8.0;
const int celebodyNum = 1;
vec4 scale = vec4(255.0, 255.0, 255.0, 255.0);

varying vec2 vUv;
uniform float resolution;
// uniform float G;
uniform float pNum;
uniform float nodeNum;
// uniform sampler2D tree;
uniform sampler2D posTexture;
uniform sampler2D velTexture;

uniform sampler2D boundTex;
uniform sampler2D CMTex;
uniform sampler2D typeTex;
vec3 pos;
vec3 vel;
float count = 0.0;
float mass;
struct Celebody {
	vec3 pos; // position
	vec3 vel; // velocity
	vec3 acc; // acceleration
	float mass;
};

Celebody celebodyCons(vec3 pos, vec3 vel, vec3 acc, float mass) {
	Celebody celebody;
	celebody.pos = pos;
	celebody.vel = vel;
	celebody.acc = acc;
	celebody.mass = mass;
	return celebody;
}

Celebody celebodies[celebodyNum]; 

struct Items {
	int ids[10]; // max particles in one cell
	vec3 CoM;
	float mass;
};

// bound
struct Cell {
	vec3 center;
	float chalf;
};
Cell cellCons(float x, float y, float z, float chalf) {
	Cell c;
	c.center = vec3(x, y, z);
	c.chalf = chalf;
	return c;
}

struct TreeNode {
	Cell cell;
	Items items;
	int isLeaf; //1 true  0 false
};

struct StackEntry {
	float data;
};

struct Stack {
	int current;
	StackEntry entries[MAX_STACK_SIZE];
};

StackEntry stackEntryCons(float data) {
	StackEntry se;
	se.data = data;
	return se;
}
void Push(inout Stack stack, StackEntry entry) {
	stack.current++;
    if(stack.current == 0)
    	stack.entries[0] = entry;
    else if(stack.current == 1)
    	stack.entries[1] = entry;
    else if(stack.current == 2)
    	stack.entries[2] = entry;
    else if(stack.current == 3)
    	stack.entries[3] = entry;
}

StackEntry Pop(inout Stack stack) {
    StackEntry entry;
    if(stack.current == 0) 
    	entry = stack.entries[0];
    else if(stack.current == 1) 
    	entry = stack.entries[1];
    else if(stack.current == 2) 
    	entry = stack.entries[2];
    else if(stack.current == 3) 
    	entry = stack.entries[3];
    stack.current--;
    return entry;
}

StackEntry getTop(inout Stack stack) {
	if(stack.current == 0)
		return stack.entries[0];
	else if(stack.current == 1)
		return stack.entries[1];
	else if(stack.current == 2)
		return stack.entries[2];
	else if(stack.current == 3)
		return stack.entries[3];
}
TreeNode bhRoot;// root
// const int nodesNum = 4681;
TreeNode bhTree[nodesNum];// 4681 cells, 5 levels, 1+8+8^2+8^3+8^4


bool contains(Cell c, float x, float y, float z) {
	float chalf = c.chalf;
	vec3 center = c.center;
  	return center.x - chalf <= x && x < center.x + chalf &&
    	center.y - chalf <= y && y < center.y + chalf &&
    	center.z - chalf <= z && z < center.z + chalf;
}

void init() {
	
	// for(int i = 0; i < nodesNum; i ++) {
	// 	bhTree[i].isLeaf = 1;
	// }
	pos = texture2D(posTexture, vUv).xyz;
	// vec4 vm = texture2D(velTexture, vUv);
	// vel = vm.xyz;
	// mass = vm.a;
	
}
void computeAOf2(inout vec3 a, vec3 pos2, float mass2) {
	vec3 dPos = pos2 - pos;
	float distance = length( dPos );
	float distanceSq = distance * distance;// dot(dPos, dPos);

	a += G * mass2 / distanceSq * normalize( dPos );
	// if(count == 1.0)
	// 	a = pos2 / 100.0 + 101.0;
	// count++;
}

// bool handle(float index, inout vec3 a, vec4 nodeType) {
// 	// count += 1.0;
// 	vec4 cm = texture2D(CMTex, vec2(0.0, (index + 0.5) / nodeNum));
// 	vec3 pos2;
// 	float mass2;
// 	if(nodeType.a == NLEAF) {
// 		float pi;
// 		if(nodeType.x != -1.0 && (nodeType.x+0.5)/pNum != vUv.y) {
// 			pi = nodeType.x;
// 			pos2 = texture2D(posTexture, vec2(0.0, (pi+0.5)/pNum)).xyz;
// 			mass2 = texture2D(velTexture, vec2(0.0, (pi+0.5)/pNum)).a;
			
// 			computeAOf2(a, pos2, mass2);
			
// 		}
// 		if(nodeType.y != -1.0 && (nodeType.y+0.5)/pNum != vUv.y) {
// 			pi = nodeType.y;
// 			pos2 = texture2D(posTexture, vec2(0.0, (pi+0.5)/pNum)).xyz;
// 			mass2 = texture2D(velTexture, vec2(0.0, (pi+0.5)/pNum)).a;
// 			computeAOf2(a, pos2, mass2);
// 		}
// 		if(nodeType.z != -1.0 && (nodeType.z+0.5)/pNum != vUv.y) {
// 			pi = nodeType.z;
// 			pos2 = texture2D(posTexture, vec2(0.0, (pi+0.5)/pNum)).xyz;
// 			mass2 = texture2D(velTexture, vec2(0.0, (pi+0.5)/pNum)).a;
// 			computeAOf2(a, pos2, mass2);
// 		}
// 		a = abs(a);
// 		// count += 10.0;
// 	} else {
// 		vec4 bound = texture2D(boundTex, vec2(0.0, (index+0.5)/nodeNum));
// 		float s = 2.0 * bound.a;
// 		float d = distance(bound.xyz, pos);
// 		if (s / d < BH_THETA) {
// 			mass2 = cm.a, pos2 = cm.xyz;
// 			computeAOf2(a, pos2, mass2);
// 			// count += 1.0;
// 			return true;
// 		}

// 	}
	
// 	return false;
// }
vec3 computeA() {
	
	float maxNode = nodeNum - 1.0;
	vec4 p = texture2D(posTexture, vUv);
	vec3 a;
	// traverse tree

	float index = 0.0;
	StackEntry indexEntry;
	float sibIndex = 1.0;
	Stack stack;
	stack.current = -1;
	vec4 nodeType = texture2D(typeTex, vec2(0.0, (index + 0.5) / nodeNum));
	// count += 1.0;
	// if(nodeType.a == NNODE)
	// 	a.g = 12.0;
	
	for(int l1 = 0; l1 < 100; l1 ++) { 
		if(nodeType.a == NNULL && stack.current == -1 && sibIndex > maxSib)
			break;
		// nodeType.a == NNODE && 
		// if(sibIndex == 2.0) {
		// 	count += 1.0;
		// 	break;
		// }
		
		// count += 1.0;
		// 如果不为空且不超出最大节点数，那么先处理，再压栈 
		for(int l2 = 0; l2 < 5; l2 ++) {
			if(nodeType.a == NNULL || index > maxNode){// node is null
				count += 0.1;
				break;
			}
			// do with node
			// bool ib = handle(index, a, nodeType);
			// if(ib)
			// 	break;
			if(nodeType.a == NNULL)
				count += 0.1;
			vec4 cm = texture2D(CMTex, vec2(0.0, (index + 0.5) / nodeNum)); 
			vec3 pos2;
			float mass2;
			if(nodeType.a == NLEAF) {
				// count++;
				float pi;
				if(nodeType.x != -1.0 && (nodeType.x+0.5)/pNum != vUv.y) {
					pi = nodeType.x;
					pos2 = texture2D(posTexture, vec2(0.0, (pi+0.5)/pNum)).xyz;
					mass2 = texture2D(velTexture, vec2(0.0, (pi+0.5)/pNum)).a;
					
					computeAOf2(a, pos2, mass2);
					// vec3 dPos = pos2 - pos;
					// float distance = length( dPos );
					// float distanceSq = distance * distance;// dot(dPos, dPos);

					// a += G * mass2 / distanceSq * normalize( dPos );

				}
				if(nodeType.y != -1.0 && (nodeType.y+0.5)/pNum != vUv.y) {
					pi = nodeType.y;
					pos2 = texture2D(posTexture, vec2(0.0, (pi+0.5)/pNum)).xyz;
					mass2 = texture2D(velTexture, vec2(0.0, (pi+0.5)/pNum)).a;
					
					computeAOf2(a, pos2, mass2);
				}
				if(nodeType.z != -1.0 && (nodeType.z+0.5)/pNum != vUv.y) {
					pi = nodeType.z;
					pos2 = texture2D(posTexture, vec2(0.0, (pi+0.5)/pNum)).xyz;
					mass2 = texture2D(velTexture, vec2(0.0, (pi+0.5)/pNum)).a;

					computeAOf2(a, pos2, mass2);
				}
				
			} else if (nodeType.a == NNODE) {
				vec4 bound = texture2D(boundTex, vec2(0.0, (index+0.5)/nodeNum));
				float s = 2.0 * bound.a;
				float d = distance(bound.xyz, pos);
				if (s / d < BH_THETA) {
					mass2 = cm.a, pos2 = cm.xyz;
					computeAOf2(a, pos2, mass2);
					break;
				}

			}
			// return a;
			Push(stack, stackEntryCons(index));
			index = index * 8.0 + 1.0;
			// if(index == 1.0) 
			// 	count += 100.0;
			sibIndex = 1.0;
			nodeType = texture2D(typeTex, vec2(0.0, (index + 0.5) / nodeNum));
			
		}
		
		// break;
		// 如果是最后一个兄弟节点或index超出，那么返回上一层，如果是根节点，那么函数返回
		for(int l3 = 0; l3 < 5; l3 ++) {
			if(index == 0.0){
				// a.b = 123.0;
				a.b = count;
				a = abs(a);
				return a; 
			}
			if(sibIndex != maxSib)
				break;
			indexEntry = Pop(stack);
			index = indexEntry.data;
			
			sibIndex = mod(index, 8.0);

		}
		
		
		// 下一个兄弟节点
		indexEntry = getTop(stack);
		index = indexEntry.data;
		index = index * 8.0 + ++sibIndex;
		nodeType = texture2D(typeTex, vec2(0.0, (index + 0.5) / nodeNum));
		
	}
	a.b = count;
	a.r = 233.0;
	
	return a;
}

vec4 testCase() {
	vec4 r;
	
	r = vec4(computeA(), 0.0);
	// r = texture2D(velTexture, vec2(0.0, 0.0));
	// r = texture2D(CMTex, vec2(0.0, (1.0 + 0.5) / nodeNum));
	
	r /= scale;
	return r;
}


void main() {
	
	// vec4 tBytes = texture2D(tree, vUv) * 255.0;

	init();
	vec4 testResult = testCase();
	
	
	// gl_FragColor = vec4(1.0, 0.5, 0, 0.5);
	gl_FragColor = testResult;
	
}
	