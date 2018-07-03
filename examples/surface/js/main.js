'use strict';
let D3 = get3DLib({
        WIDTH: 1024, 
        HEIGHT:500,
        CLEAR_COLOR:"#223",
    }),
    {Point} = D3,
    B_SUM = 0;

// INPUT DATA
const N = 5,
      p0 = new Point(0,0,0),
      p1 = new Point(1,0,0),
      p2 = new Point(0,1,0),
      PLANE_COLOR = "rgb(128,128,248,0.2)",
      POINT_COLOR = "#fff",
      POINT_LINE_COLOR = "rgba(255,255,0, .5)",
      SELECTED_POINT_COLOR = "red",
      BORDER_COLOR = "crimson",
      triples = [],
      B = {};


var inputData = {
    currentPoint: undefined,
    points: [],
    weights: [],
    options: [],
};
function initPoint(i,j,k) {
    let dx = p1.minus(p0).getUnitVector(),
        dy = p2.minus(p0).getUnitVector(),
        dz = dx.crossProduct(dy).getUnitVector(),
        z = 0;
    return dx.times(i/2).plus(dy.times(j/2)).plus(dz.times((Math.random()-.5)*.1));
}

for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N-i; j++) {
        const k = N-i-j,
              ind = i*100+j*10+k;
        let top = [],
            bottom = [];
        triples.push({i: i, j: j, k: k});
        for (let z = 2; z <= N; z++) top.push(z);
        for (let z = 2; z <= i; z++) bottom.push(z);
        for (let z = 2; z <= j; z++) bottom.push(z);
        for (let z = 2; z <= k; z++) bottom.push(z);
        B[""+i+j+k] = product(top, bottom);
        B_SUM+=B[""+i+j+k];
        inputData.options.push({text: `P[${i},${j},${k}]`,value: triples[triples.length-1]});

        inputData.points[ind] = initPoint(i,j,k);
        inputData.weights[ind] = 1;
    }
}
inputData.currentPoint = triples[0];

// GRAPHICS INITIALIZATION 
(function() {
    const CAMERA_SPEED = 0.3;
    let {Point, setCameraPos, CTX, Camera, CameraMove, D3DrawingLoop, GetOriginDraw} = D3,
        camera = new Camera(Point.NULL,Point.NULL, 0.1, 10000, D3.WIDTH / D3.HEIGHT, Math.PI/4),
        d3loop = new D3DrawingLoop(camera,CTX,draw),
        cameraMove = new CameraMove(camera, CameraMove.makeAroundHandler(Point.NULL, CAMERA_SPEED), d3loop.onChangeHandler, window);
    
    function init() {
        console.log("init");
        cameraMove.turnOn();
        d3loop.start()
        setCameraPos(camera,new Point(4,4, 4));
    }
    function standardNumber(Name) {
        return function(newValue, oldValue) {
            d3loop.onChangeHandler();
        }
    }
    // Vue.js
    let app = new Vue({
        el: '#inputApp',
        data: inputData,
    });
    Object.keys(inputData).forEach(e=>{
        app.$watch(e, standardNumber(e));
    });
    [...document.querySelectorAll("input")].forEach(e=>e.addEventListener("input", function() {
        d3loop.onChangeHandler();
    }));
    

    window.addEventListener('load', init);
}())

function drawCurve(drawer, curve, from, to, n = 10, color="#000") {
    const step = (to - from) / (n-1);
    let lastPoint = null;
    for (let i = 0; i < n; i++) {
        const point = curve(from + step * i);
        drawer.pushPoint(point, color);
        if (lastPoint != null) {
            drawer.pushLine(lastPoint, point);
        }
        lastPoint = point;
    }
}

let drawOrigin = D3.GetOriginDraw();

function bezierPlane(points, weights,triples) {
    return function(a,b,c=1-a-b) {
        let res = new Point(0,0,0),
            sum = 0;
        triples.forEach(({i,j,k})=>{
            const ind = i*100+j*10+k
            let curP = points[ind];
            const coef = B[""+i+j+k]*Math.pow(a,i)*Math.pow(b,j)*Math.pow(c,k)*weights[ind];
            sum += coef;
            res = res.plus(curP.times(coef));
        });
        res = res.times(1.0/sum);
        return res;
    }
}
var da = 1/32;
var db = 1/32;
function draw(drawer) {
    drawOrigin(drawer);
    let t = inputData.currentPoint;
    inputData.points.forEach((p,ind,a)=>{
        if (ind == t.i * 100 + t.j*10+t.k)
            drawer.pushPoint(p, SELECTED_POINT_COLOR, 5);
        else
            drawer.pushPoint(p, POINT_COLOR, 3);
        let prev = ind-1;
        while (prev >= 0 && typeof a[prev--] == "undefined");
        prev++;
        if (prev >= 0 && (prev / 100)>>0 == (ind / 100)>>0)
            drawer.pushLine(p,a[prev], POINT_LINE_COLOR);
    });
    let bezier = bezierPlane(inputData.points, inputData.weights, triples);
    const planeColor = PLANE_COLOR;
    for (let a = 0; a <= 1+da/2; a+=da) {
        for (let b = 0; b <= 1-a+db/2; b += db) {
            let p = bezier(a,b),
                p2 = bezier(a-da,b),
                p3 = bezier(a,b-db),
                p4 = bezier(a-da, b-db);
            if (a >= da) {
                drawer.pushLine(p, p2, planeColor);
            }
            if (b >= db) {
                drawer.pushLine(p, p3, planeColor);   
            }
            if (a >= da && b >= db)  {
                drawer.pushLine(p, p4, planeColor);
            }
        }
    }
    const lineColor=BORDER_COLOR,
          step = da/2;
    for (let t = step; t <= 1+step/2; t+=step) {
        drawer.pushLine(bezier(t,0), bezier(t-step,0), lineColor);
        drawer.pushLine(bezier(0,t), bezier(0,t-step), lineColor);
        drawer.pushLine(bezier(t, 1-t), bezier(t-step, 1-t+step), lineColor);

    }
}

function product(topArr, bottomArr) {
    let res = 1,
        bottom = 0;
    topArr.sort((a,b)=>a-b);
    bottomArr.sort((a,b)=>a-b);

    if (topArr.includes(0)) return 0;

    for (let i = 0; i < topArr.length; i++) {
        res *= topArr[i];
        while(res % bottomArr[bottom] == 0) {
            res /= bottomArr[bottom];
            bottom++;
        }
    }
    while (bottom < bottomArr.length) {
        res /= bottomArr[bottom++];
    }
    return res;
}