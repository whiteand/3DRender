'use strict';

// Решаемая задача: отобразить кривую, и её эволюту
// INPUT DATA
let D3 = get3DLib({
    WIDTH: 1000, 
    HEIGHT:500,
    CLEAR_COLOR:"#223",
});

let {Point} = D3;

// Константы оформления
const POINT_COLOR = "white",
      SELECTED_POINT_COLOR = "crimson",
      CURVE_COLOR = "white",
      EVOLUTA_COLOR = "blue",
      EVOLVENTA_COLOR = "yellow",
      ROTATE_COLOR = "crimson",
      CURRENT_POINT_COLOR = "red",
      TEXT_COLOR = "yellow",
      TEXT_SIZE = 12;

// Кол-во входных точек
const N = 5;


// Входные данные для задачи (объект используется Vue.js)
var inputData = {
    currentT: 0,
    currentPoint: 0,
    points: [],
    draw: {
        "curve": true,
        "evoluta": true,
        "evolventa": false,
        "rotate": false,
    },
    options: [],
};

for (let i = 0; i <= N; i++) {
    inputData.options.push({text: `P${i}`,value: i});
    const  phi = i /  (N+1) * Math.PI * 2,
           cos = Math.cos(phi),
           sin = Math.sin(phi),
           R = 2;
    inputData.points[i] = new Point(cos * R,sin * R,0);
}



// INITIALIZATION 
(function() {
    // Получаем необходимые части библиотеки
    let {Point, setCameraPos, CTX, Camera, CameraMove, D3DrawingLoop, GetOriginDraw} = D3;
    // Константа скорости перемещения
    const CAMERA_SPEED = 0.3;

    // Создаём камеру, которой будем проецировать изображение
    // Параметры в порядке следования
    // position - начальная позиция камеры (В данном случае не важно, так как
    //      оно будет задаваться отдельно далее в функции init() с использованием функции setCameraPos())
    // direction - начальное направление камеры. Аналогично будет задаваться  далее
    // near - минимальное расстояние отображаемого объекта до камеры
    // far - максимальное расстояние
    // aspectRatio - соотношение в экрана
    // viewAngle - горизонтальный угол обзора камеры
    // constructor(position, direction, near, far, aspectRatio, viewAngle)
    let camera = new Camera(Point.NULL,Point.NULL, 0.1, 10000, D3.WIDTH / D3.HEIGHT, Math.PI/4);

    // Организация цикла взаимодействия
    //constructor(drawer, CTX, drawFunc, color="#fff", updateFunc=()=>{})
    let d3loop = new D3DrawingLoop(camera,CTX,draw)

    // Создаём объект отвечающий за перемещение камеры
    // Конструктор принимает 
    // Камеру
    // Объект, который определяет характер управления камерой
    let cameraMove = new CameraMove(camera, CameraMove.makeAroundHandler(Point.NULL, CAMERA_SPEED), d3loop.onChangeHandler);

    // Функция старта всего
    // Запускается после окончния загрузки страницы
    function init() {
        console.log("init");
        cameraMove.turnOn();
        d3loop.start()
        setCameraPos(camera,new Point(4,4, 4));
    }


    // Организация работы с Vue.js
    function standardNumber(Name) {
        return function(newValue, oldValue) {
            d3loop.onChangeHandler();
        }
    }
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
    [...document.querySelectorAll("input")].forEach(e=>e.addEventListener("change", function() {
        d3loop.onChangeHandler();
    }));

    

    window.addEventListener('load', init);
}())

//MATH--------------------------------------------------------------------
function drawCurveAuto(drawer, curve, color="#000", from = 0, to=1) {
    let step = 1/128,
        currentT = from,
        minStep = 1e-3,
        goodDist = 5e-1,
        lastPoint = null;
        
    while (currentT <= to+step/2) {

        let p = curve(currentT),
            prevT = currentT - step,
            dist = 0,
            nextT = 0,
            nextP = null;
        
        if (lastPoint != null) {
            while (p.getDistance(lastPoint) > goodDist && step > minStep) {
                step /= 2;
                p = curve(prevT + step);
            }
            if (p.getDistance(lastPoint < goodDist)) step *= 3;
            drawer.pushLine(lastPoint, p, color);
        }
        drawer.pushPoint(p, color);
        currentT += step;
        lastPoint = p;
    }
}
function drawCurve(drawer, curve, n = 10,color="#000",from =0, to=1) {
    const step = (to - from) / (n-1);
    let lastPoint = null;
    for (let i = 0; i < n; i++) {
        const point = curve(from + step * i);
        drawer.pushPoint(point, color);
        if (lastPoint != null) {
            drawer.pushLine(lastPoint, point, color);
        }
        lastPoint = point;
    }
}


// LABORATORY ------------------------------------------------------------
let drawOrigin = D3.GetOriginDraw();
let {bezierCurve: bezier} = D3;

function draw(drawer) {
    drawOrigin(drawer);
    let curve = bezier(...inputData.points);
    inputData.points.forEach((p,i)=>{
        if (i == inputData.currentPoint) {
            drawer.pushPoint(p,SELECTED_POINT_COLOR, 5);
        } else {
            drawer.pushPoint(p,POINT_COLOR,3);
        }
    })
    let d1 = getDeriv1(curve);
    let d2 = getDeriv2(curve);
    let d3 = getDeriv3(curve);
    const steps = 32;
    let n = addCurves(getNormalCalc(curve), curve);
    let evoluta = getEvoluta(curve, d1, d2)
    let evolventa = addCurves(curve, d1);
    let rotate = getRotate(curve, d1,d2,d3);
    if (inputData.draw.curve)
        showCurve(drawer, "Крива", curve, steps, CURVE_COLOR);
    if (inputData.draw.evoluta)
        showCurve(drawer, "Еволюта", evoluta, "auto", EVOLUTA_COLOR);
    if (inputData.draw.evolventa)
        showCurve(drawer, "Евольвента", evolventa, steps, EVOLVENTA_COLOR);
    if (inputData.draw.rotate)
        showCurve(drawer, "Крива радіусів скруту", rotate, "auto", ROTATE_COLOR);
}
function getEvoluta(curve, deriv1, deriv2, step = 1/128) {
    let n = getNormalFromD1(deriv1, step);
    let k = getK(deriv1, deriv2);
    return addCurves(curve,function(t) {
        const norm = n(t);
        return norm.times(1/k(t));
    });
}
function getRotate(curve, d1,d2,d3, step=1/128) {
    const top = getTop(d1);
    // const top = getNormalFromD1(d1);
    const k2 = getK2(d1,d2,d3);
    return addCurves(curve, function(t) {
        const _k2 = k2(t);

        // return top(t).times(1/k2(t)*10000);
        return top(t).times(1/k2(t)*1e6);
        // return top(t);
    });
}
function getNormalFromD1(d1, step=1/512) {
    return function(t) {
        const rd1 = d1(t);
        const rdh = d1(t+step);
        return rd1.crossProduct(rdh.crossProduct(rd1))
                  .getUnitVector();
    }
}
function getNormalCalc(curve, step = 1/512) {
    return function(t) {
        const preP = curve(t-step);
        const curP = curve(t);
        const postP = curve(t+step);
        const a = curP.minus(preP);
        const b = postP.minus(curP);
        return a.plus(b).crossProduct(b.crossProduct(a)).getUnitVector();
    }
}

function getK(deriv1, deriv2) {
    return function(t) {
        const rd1 = deriv1(t);
        const rd2 = deriv2(t);
        const top = rd1.crossProduct(rd2).length;
        const bottom = Math.pow(rd1.length, 3);
        return top/bottom;
    }
}

function getTop(d1, step = 1/512) {
    return function(t) {
        return d1(t+step).crossProduct(d1(t)).getUnitVector();
    }
}

function getDeriv(curve, step=1/(2<<16)) {
    return function(t) {
        let prev = curve(t-step);
        let next = curve(t+step);
        let res = next.minus(prev).times(1/step);
        return res;
    }
}

function getDeriv1(curve) {
    return getDeriv(curve);
}

function getDeriv2(curve) {
    return getDeriv(getDeriv(curve));
}

function getDeriv3(curve) {
    return getDeriv(getDeriv(getDeriv(curve)));
}

function getK2(d1, d2, d3) {
    let getK1 = getK(d1,d2);
    return function(t) {
        const rd1 = d1(t);
        const rd2 = d2(t);
        const rd3 = d3(t);
        const k1 = getK1(t);
        return -rd1.tripleProduct(rd2,rd3)/k1/k1;
    }
}

function showCurve(drawer,caption, c, n = 128, color = "rgba(0,0,0,.3)") {
    if (n == "auto") {
        drawCurveAuto(drawer, c, color);
    } else {
        drawCurve(drawer, c, n, color);
    }
    drawer.pushPoint(c(inputData.currentT), CURRENT_POINT_COLOR, 4);
    drawer.pushText(caption, c(.5), -10, 10,TEXT_COLOR, TEXT_SIZE);
}
function unitaryCurve(c) {
    return function(t) {
        return c(t).getUnitVector();
    }
}
function addCurves(...c) {
    return function(t) {
        return c.reduce((v, curve)=>v.plus(curve(t)),new Point(0,0,0));
    }
}
function id(t) { return t; }
function zero(t) { return 0; }
function makeCurve(x = zero,y = zero,z = zero) {
    return function(t) {
        return new Point(x(t), y(t), z(t));
    }
}
