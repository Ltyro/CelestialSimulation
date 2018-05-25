#define nodesNum 73
#define MAXLEVEL 5
#define MAX_STACK_SIZE 8
// #define c 0// current node index
// global varies
int lastLevelIndex = 9;
const int celebodyNum = 1;
vec4 scale = vec4(255.0, 255.0, 255.0, 255.0);

varying vec2 vUv;

uniform float resolution;
// uniform sampler2D tree;
uniform sampler2D posTexture;
uniform sampler2D velTexture;

uniform sampler2D boundTex;
uniform sampler2D CMTex;
uniform sampler2D typeTex;

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
	
	for(int i = 0; i < nodesNum; i ++) {
		bhTree[i].isLeaf = 1;
	}
	
	
}
void handle(float index, inout vec3 a) {
	a.r += 1.0;
}
vec3 computeA() {
	const float NLEAF = 1.0;
	const float NNODE = 0.0;
	const float NNULL = -1.0;
	const float maxSib = 8.0;
	float maxNode = 1.0 - 1.0;
	vec4 p = texture2D(posTexture, vUv);
	vec3 a;
	// traverse tree

	float index = 0.0;
	StackEntry indexEntry;
	float sibIndex = 1.0;
	Stack stack;
	stack.current = -1;
	vec4 nodeType = texture2D(typeTex, vec2(0.0, index));
	
	for(int l1 = 1; l1 > 0; l1 ++) { 
		if(nodeType.a == NLEAF && stack.current == -1 && sibIndex > maxSib)
			break;
		// 如果不为空，那么先处理，再压栈 
		for(int l2 = 1; l2 > 0; l2 ++) {
			if(nodeType.a == NNULL || index > maxNode)// node is null
				break;
			// do with node
			handle(index, a);
			Push(stack, stackEntryCons(index));
			index = index * 8.0 + 1.0;
			
			sibIndex = 1.0;
			nodeType = texture2D(typeTex, vec2(0.0, index));
		}
		// 如果是最后一个兄弟节点或index超出，那么返回上一层，如果是根节点，那么函数返回
		for(int l3 = 1; l3 > 0; l3 ++) {
			if(index == 0.0)
				return a;
			if(sibIndex != maxSib || index <= maxNode)
				break;
			indexEntry = Pop(stack);
			index = indexEntry.data;
			
			// sibIndex = index % 8.0;
		}
		// 下一个兄弟节点
		indexEntry = getTop(stack);
		index = indexEntry.data;
		index = index * 8.0 + ++sibIndex;
		nodeType = texture2D(typeTex, vec2(0.0, index));
	}
	// if(nodeType.a == NLEAF)
	// 	a.r = 1.0;
	// if(stack.current == -1)
	// 	a.g = 1.0;
	// if(sibIndex > maxSib)
	// 	a.b = 1.0;

	return a;
}

vec4 testCase() {
	vec4 r;
	
	r = vec4(computeA(), 0.0);
	
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