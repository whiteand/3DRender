/// Библиотека дял рисования 3д графики в canvas
var get3DLib = (function(settings){
    // isZero возвращает true, если его модуль меньше eps
    function isZero(a, eps=1e-10) {
        return Math.abs(a) < eps;
    }

    // isFloatEqual проверяет равенство двух чисел с плавающей запятой
    // с точностью eps
    function isFloatEqual(a,b, eps=1e-10) {
        return isZero(a-b, eps);
    }

    // gauss Решает систему линейных уравнений
    // gauss([[1,1], [1,-1]],[5,1]) => [3,2]
    // Тоесть имея такую систему:
    // 1*x + 1*y = 5
    // 1*x + (-1)*y = 1
    // Решение: x = 3, y = 2
    // Почему минимизирована: не помню.
    // Но думаю для экономии места. Алгоритм Гаусса довольно давно написал.
    // И подумал, что никогда не буду его дорабатывать 
    // Алгоритм называется: "метод Гаусса с выбором главного элемента"
    let gauss=function(){function r(r,f,o){for(var a=[];r<f;r++)a.push(o);return a}var f=Math.abs;return function(o,a){var n,t,u;for(n=0;n<o.length;n++)o[n].push(a[n]);var v=o.length;for(n=0;n<v;n++){var e=f(o[n][n]),h=n;for(t=n+1;t<v;t++)f(o[t][n])>e&&(e=f(o[t][n]),h=t);for(t=n;t<v+1;t++){var s=o[h][t];o[h][t]=o[n][t],o[n][t]=s}for(t=n+1;t<v;t++){var c=-o[t][n]/o[n][n];for(u=n;u<v+1;u++)n===u?o[t][u]=0:o[t][u]+=c*o[n][u]}}for(a=r(0,v,0),n=v-1;n>-1;n--)for(a[n]=o[n][v]/o[n][n],t=n-1;t>-1;t--)o[t][v]-=o[t][n]*a[n];return a}}();

    // bezier возвращает функцию кривой безье построенную на точках a,
    // Пример:
    // Получаем кривую 2-го порядка(из трех точек)
    // var f = bezier(new Point(0,0,0), new Point(1,2,0), new Point(4,0,0))
    // Получить первую точку кривой
    // var startPoint = f(0)
    // Получить конечную точку кривой
    // var endPoint = f(1)
    // Минимизирована - по сходным причинам, что и сверху: не думал, что буду дорабатывать.
    function bezier(...a){a.reverse();const b=[],d=a.length-1;let e=function(){let f=[],g=function(j,k){for(var l=1;k--;)l*=j--;return l},h=function(j,k){return k>j?0:g(j,k)/g(k,k)};return function(j,k){if(1>=j)return 1;if(0==k)return 1;if(1==k)return j;if(j==k)return 1;if(k>j)throw`Cannot get ${k} from ${j}`;return"undefined"!=typeof f[j]&&"undefined"!=typeof f[j][k]?f[j][k]:("undefined"==typeof f[j]&&(f[j]=[]),f[j][k]=h(j,k),f[j][k])}}();for(let f=0;f<=d;f++)b[f]=e(d,f);return function(f){var g=new Point(0,0,0);for(let h=0;h<d+1;h++){const j=Math.pow(f,d-h)*Math.pow(1-f,h)*b[h],k=a[h].times(j);g=g.plus(k)}return g}}
    // canvas-init.js

    // Получаем ссылку на холст
    const canvas = document.getElementById('canvas');

    // Если параметры ширины и/или высоты, и/или 
    if (!settings.WIDTH) settings.WIDTH = 600;
    if (!settings.HEIGHT) settings.HEIGHT = 600;
    if (!settings.CLEAR_COLOR) settings.CLEAR_COLOR = "#fff";

    // Отдельные константы для размера экрана
    const WIDTH = canvas.width = settings.WIDTH;
    const HEIGHT = canvas.height = settings.HEIGHT;

    // Достаём контекст
    const ctx = canvas.getContext('2d');

    // Декоратор над контекстом (для более удобного рисования)
    const CTX = {
        // clearScreen очищает холст
        clearScreen: function(color) {
            if (typeof color === 'undefined')
                return ctx.clearRect(0,0, WIDTH, HEIGHT);

            const oldColor = ctx.fillStyle;
            ctx.fillStyle = color;
            ctx.fillRect(0,0,WIDTH,HEIGHT);
            ctx.fillStyle = oldColor;
        },
        // clearScreen рисует линию от (x0,y0) до (x1,y1) имеющую цвет color
        // и ширину width
        // Использует координаты экрана
        drawLine: function(x0,y0,x1,y1, color='#000', width=1) {
            const oldStyle = ctx.strokeStyle;
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.moveTo(x0,y0);
            ctx.lineTo(x1,y1);
            ctx.closePath();
            ctx.stroke();
            ctx.strokeStyle = oldStyle;
        },
        // drawPoint рисует точку (x,y) имеющую цвет color и радиус r
        // Если должна быть заполнена isFill = true
        // Использует координаты экрана
        drawPoint: function(x,y,color="#000", r=4, isFill=true) {
            const oldStyle = isFill ? ctx.fillStyle : ctx.strokeStyle;
            ctx.beginPath();
            if (isFill) 
                ctx.fillStyle = color;
            else
                ctx.strokeStyle = color;
            ctx.arc(x,y,r,0,Math.PI * 2);
            ctx.closePath();
            if (isFill) 
            {
                ctx.fill();
                ctx.fillStyle = oldStyle;
            } else {
                ctx.stroke();
                ctx.strokeStyle = oldStyle;   
            }
        },
        // drawText рисует текст text начиная с точки (x,y) имеющий
        // цвет color и размер шрифта - fontSize
        // Использует координаты экрана
        drawText: function(text, x,y, color="#000", fontSize=25) {
            const oldStyle = ctx.fillStyle;
            ctx.fillStyle = color;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.fillText(text, x, y);
            ctx.fillStyle = oldStyle;
        }
    };

    // Класс представляющий точку(или вектора) в трёхмерном пространстве
    // Я его написал гораздо раньше. Сюда практически без изменений включён
    class Point {
        /** Create Point from coordinates, or from Point*/
        constructor(x, y = 0, z = 0) {
            if (typeof x === 'number') {
                this.x = x;
                this.y = y;
                this.z = z;
            }
            else {
                let p = x;
                this.x = p.x;
                this.y = p.y;
                this.z = p.z;
            }
            this.length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }
        isInIntervalBetween(a,b) {
            return isFloatEqual(a.minus(this).length + b.minus(this).length, a.minus(b).length);
        }
        /**String representations of Point */
        toString() {
            if (this.z != 0) {
                return `(${this.x}, ${this.y}, ${this.z})`;
            }
            else {
                return `(${this.x}, ${this.y})`;
            }
        }
        /** returns vector b, |b|=1, b = k * this */
        getUnitVector() {
            return new Point(this.x / this.length, this.y / this.length, this.z / this.length);
        }
        /** returns vector b = (this.x + another.y, this.y + another.y, this.z + another.z) */
        plus(another) {
            return new Point(this.x + another.x, this.y + another.y, this.z + another.z);
        }
        /** returns vector b = (this.x - another.y, this.y - another.y, this.z - another.z) */
        minus(another) {
            return new Point(this.x - another.x, this.y - another.y, this.z - another.z);
        }
        /** returns vector that c, c is perpendicular to this and other, i x j = k */
        crossProduct(another) {
            return new Point(this.y * another.z - this.z * another.y, another.x * this.z - another.z * this.x, this.x * another.y - this.y * another.x);
        }
        /** returns number r = this * b = this.x*b.x + this.y*b.y + this.z*b.z */
        dotProduct(another) {
            return this.x * another.x + this.y * another.y + this.z * another.z;
        }
        /**
         * Example: a = new Point(1.23, 2.34,3.456)
         * a.format(1) -> (1.2, 2.3, 3.5)
         * a.format(2) -> (1.23, 2.34, 3.46)
         * @param k positive integer value. (typeof k == 'number', k - k|0 > 1e-10)
         */
        format(k) {
            if (typeof k !== 'number' || Math.abs(k - Math.floor(k)) > 1e-10)
                throw new Error("Parameter 'k' must be positive integer value");
            const ten = Math.pow(10, k);
            return `(${Math.round(this.x * ten) / ten}, ${Math.round(this.y * ten) / ten}, ${Math.round(this.z * ten) / ten})`;
        }
        /**
         * returns distance from 'this' to 'another'
         * @param another another Point.
         */
        getDistance(another) {
            return Math.sqrt((this.x-another.x)*(this.x-another.x)+(this.y-another.y)*(this.y-another.y)+(this.z-another.z)*(this.z-another.z));
        }
        /**
         * if this = (a0,a1,a2),
         *    b = (b0,b1,b2),
         *    c = (c0,c1,c2)
         *
         * returns a0*b1*c2 + a1*b2*c0 + a2*b0*c1 -a2*b1*c0 - a1*b0*c2 - a0*b2*c1
         * @param b second vector of tripple product
         * @param c third vector of tripple product
         */
        tripleProduct(b, c) {
            return this.x * b.y * c.z +
                this.y * b.z * c.x +
                this.z * b.x * c.y -
                this.z * b.y * c.x -
                this.y * b.x * c.z -
                this.x * b.z * c.y;
        }
        /** return this * k -> (this.x * k, this.y * k, this.z * k)
         * @param k - returned vector will be k * this
         */
        times(k) {
            return new Point(this.x * k, this.y * k, this.z * k);
        }
        /**
         * returns (this.x * kx,this.y * ky, this.z * kz)
         * or
         * returns (this.x * kx.x, this.y * kx.y, this.z * kx.z) if kx is Point
         * else throw Error
         * @param kx to scale x-coord
         * @param ky to scale y-coord
         * @param kz to scale z-coord
         */
        scale(kx, ky, kz) {
            if (typeof kx == 'number' && typeof ky == 'number' && typeof kz == 'number') {
                return new Point(this.x * kx, this.y * ky, this.z * kz);
            }
            else if (kx instanceof Point) {
                return new Point(this.x * kx.x, this.y * kx.y, this.z * kx.z);
            }
            else {
                throw new Error("first Parameter must be a Point, or 1-3 parameters must be numbers");
            }
        }
        /**
         * returns cos between 'this' vector and 'another'
         */
        cos(another) {
            if (Math.abs(this.length) < 1e-10 || Math.abs(another.length) < 1e-10)
                return 1;
            return Math.max(-1, Math.min(this.dotProduct(another) / this.length / another.length, 1));
        }
        /**
         * returns angle between 'this' vector and 'another'
         */
        angle(another) {
            return Math.acos(this.cos(another));
        }
        rotateAroundZ(angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return new Point(this.x * cos - this.y * sin, this.x * sin + this.y * cos, this.z);
        }
        rotateAroundY(angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return new Point(this.x * cos + this.z * sin, this.y, -this.x * sin + this.z * cos);
        }
        rotateAroundX(angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return new Point(this.x, this.y * cos - this.z * sin, this.y * sin + this.z * cos);
        }
    }
    // Часто используемые точки(вектора)
    Point.NULL = new Point(0, 0, 0);
    Point.I = new Point(1, 0, 0);
    Point.J = new Point(0, 1, 0);
    Point.K = new Point(0, 0, 1);

    // Interval представляет интервал между двумя точками
    // Не используетя, потому что не дописан.
    // Основная задача - найти пересечение двух отрезков в пространстве
    class Interval {
        constructor(pStart, pEnd) {
            this.start = pStart;
            this.end = pEnd;
        }

        _plainIntersection(ax,ay,r1x,r1y,bx,by,r2x,r2y, eps = 1e-10) {
            let [t1, t2] = gauss([[r1x,-r2x], [r1y,-r2y]], [bx-ax,by-ay]);
            if (isFinite(t1) && isFinite(t2)) {
                return {p: {x: ax+r1x*t1, y: ay+r1y*t1}, t1:t1, t2:t2};
            }
            if (isNaN(t1) || isNaN(t2)) {
                return {p: null, t1: NaN, t2: NaN};
            }
            return {p: null, t1: null, t2: null};
        }
        getIntersection(other, eps=1e-10) {    
            let [a,r1]  = [this.start, this.end.minus(this.start)];
            let [b,r2]  = [other.start, other.end.minus(other.start)];

            let {p: pxy, t1: t1xy, t2:t2xy} = this._plainIntersection(a.x,a.y,r1.x,r1.y,b.x,b.y,r2.x,r2.y);
            let {p: pxz, t1: t1xz, t2:t2xz} = this._plainIntersection(a.x,a.z,r1.x,r1.z,b.x,b.z,r2.x,r2.z);
            //let {p: pyz, t1: t1yz, t2:t2yz} = this._plainIntersection(a.y,a.z,r1.y,r1.z,b.y,b.z,r2.y,r2.z);
            if (isNaN(t1xy) && isNaN(t1xz)) {
                return this.start.plus(this.end).times(0.5);
            }
            if (!isNaN(t1xy) && (t1xy < -eps) || (t1xy > 1+eps) || (t2xy < -eps) || (t2xy > 1+eps)) {
                return null;
            }
            if (!isNaN(t1xz) && (t1xz < -eps) || (t1xz > 1+eps) || (t2xz < -eps) || (t2xz > 1+eps)) {
                return null;
            }
            if (isNaN(t1xy) && pxz != null) {
                return new Point(pxz.x, (this.start.y+this.end.y)*.5, pxz.y);
            }
            if (isNaN(t1xz) && pxy != null) {
                return new Point(pxy.x, pxy.y, this.start.z);
            }
            if (pxz != null && pxy != null && isFloatEqual(pxz.x, pxy.x, eps)) {
                return new Point(pxy.x, pxy.y, pxz.zy)
            }
            return null;
        }
        draw(drawer, color="#000", width=1) {
            drawer.pushLine(this.start, this.end, color, width);
        }
    }

    // Класс Camera - виртуальная камера, которая перемещается по сцене
    // Основная задача: перевести трёхмерные координаты в двухмерные
    class Camera {
        constructor(position = Point.NULL, direction = position.times(-1), near = 0.1, far = 100, aspectRatio = 16.0 / 9.0, viewAngle = Math.PI / 4) {
            this.position = position;
            this.direction = direction;
            this.near = near;
            this.far = far;
            this.top = this.getTop();
            this.aspectRatio = aspectRatio;
            this.viewAngle = viewAngle;
        }
        getRight() {
            return this.direction.crossProduct(this.getTop()).getUnitVector();
        }
        // Находит перспективную проекцию точки на экран
        toScreen(p, screenWidth = 1, screenHeight = 1) {
            if (typeof p == 'undefined') {
                debugger;
            }
            const distanceVector = p.minus(this.position);
            const distance = distanceVector.length;
            const pAngle = this.direction.angle(distanceVector);
            if (pAngle > Math.PI / 2 || distance < this.near || distance > this.far) {
                return null;
            }
            const dir0 = this.direction.getUnitVector();
            const O_alpha = this.position.plus(dir0.times(this.near));
            const t = (this.direction.dotProduct(O_alpha) - this.direction.dotProduct(this.position)) / this.direction.dotProduct(p.minus(this.position));
            const b_ = this.position.plus(p.minus(this.position).times(t));
            const r = this.getRight();
            const res = b_.minus(O_alpha);
            const x = res.dotProduct(r.getUnitVector());
            const y = res.dotProduct(this.getTop().getUnitVector());
            const k = Math.abs(this.near * Math.tan(this.viewAngle));
            const resVector = new Point(screenWidth * (x + k) / (2 * k), screenHeight - screenHeight * (y + k / this.aspectRatio) / (2 * k / this.aspectRatio), 0);
            return resVector;
        }

        // Возвращает текущее направление вверх для камеры
        getTop() {
            if (isZero(this.direction.z)) {
                this.top = Point.K;
            }
            else if (isZero(this.direction.x)) {
                this.top = new Point(0, -this.direction.z, this.direction.y).times(-1);
            }
            else if (isZero(this.direction.y)) {
                this.top = new Point(-this.direction.z, 0, this.direction.x).times(-1);
            }
            else {
                const { x: dx, y: dy, z: dz } = this.direction;
                const t = Math.atan(dx / dy);
                const { x: px, y: py, z: pz } = this.position;
                const x = px + Math.sin(t);
                const y = py + Math.cos(t);
                const z = (this.position.dotProduct(this.direction) - dx * x - dy * y) / dz;
                this.top = new Point(x, y, z).minus(this.position).getUnitVector().times(Math.sign(dy) * Math.sign(-dz));
            }
            return this.top;
        }
        toString() {
            return `Camera: 
Position: ${this.position.format(1)},
Direction: ${this.direction.format(1)},
Top: ${this.top.format(2)}
Near: ${this.near},
View Angle: ${this.viewAngle}`;
        }
    }
    // Следующие классы реализуют интерфейс.
    // Drawable {
    //    draw(camera)
    // }
    // Реализация для какого-то объекта в трехмерном пространстве
    // требует определить проекцию этого объекта на экран и отобразить его

    // DrawableLine - реализация Drawable для линии
    class DrawableLine {
        // start, end - трехмерные точки начала и конца линии
        constructor(start, end, color="#000", width=1) {
            this.start = start;
            this.end = end;
            this.color = color;
            this.width = Math.max(Math.floor(width), 1);
        }
        toString() {
            return `S: ${this.start.format(1)};\tE: ${this.end.format(1)};\tColor: ${this.color};\tWidth: ${this.width}`;
        }
        // Рисует линию
        draw(camera) {
            const screenStart = camera.toScreen(this.start, WIDTH, HEIGHT);
            const screenEnd = camera.toScreen(this.end, WIDTH, HEIGHT);
            if (screenEnd == null || screenStart == null) {
                return;
            }
            CTX.drawLine(screenStart.x, screenStart.y, screenEnd.x, screenEnd.y, this.color, this.width);
        }
    }

    // DrawablePoint - реализация Drawable для точки
    class DrawablePoint extends Point {
        /** Create Point from coordinates, or from Point*/
        constructor(x, y = 0, z = 0, color="#000", radius, isFill=true) {
            super(x,y,z)
            this.color = color;
            if (typeof radius != 'undefined')  {
                this.radius = radius;
            }
            this.isFill = isFill;
        }
        /**String representations of Point */
        toString() {
            return `${this.format(2)}; ${this.color}; R: ${this.radius}; fill: ${this.isFill}}`;
        }
        draw(camera) {
            const screenPoint = camera.toScreen(this, WIDTH, HEIGHT);
            const distance = camera.position.minus(this);
            const k = Drawer.MAX_POINT_SIZE * 1e0 / distance.length;

            const size = (typeof this.radius == 'undefined') ? Math.max(k, 2) : this.radius;
            if (screenPoint != null) {
                CTX.drawPoint(screenPoint.x,screenPoint.y,this.color, size, this.isFill);
            }
        }
    }
    // DrawableText - реализация Drawable для текста
    class DrawableText {
        constructor(text, point, dx,dy,color="#000", fontSize=25) {
            this.text =text;
            this.point = point;
            this.delta = new Point(dx,dy,0);
            this.color = color;
            this.fontSize = fontSize;
        }
        toString() {
            return `${this.text}, ${this.point.format(1)}`;
        }
        draw(camera) {
            let screenPoint = camera.toScreen(this.point, WIDTH, HEIGHT);
            if (screenPoint == null)
                return
            screenPoint = screenPoint.plus(this.delta);
            CTX.drawText(this.text, screenPoint.x, screenPoint.y, this.color, this.fontSize);
        }
    }

    // Drawer - класс для отрисовки трехмерных объектов(точек, линий, текста...)
    // Все объекты складываются в очередь и рисуются на экране - в порядке удаления от
    // камеры
    // Сначала рисуются линии, потом точки, потом текст
    class Drawer {
     constructor(camera) {
        this.camera = camera;
        this.lines = [];
        this.points = [];
        this.texts = [];
     }
     drawAll() {
        //this.sortFromNearToFar();
        // DRAW LINES
        this.lines.sort((line0, line1)=>{
            const dir0 = (line0.end.plus(line1.start))
                .times(0.5)
                .minus(this.camera.position).length;
            const dir1 = (line1.end.plus(line1.start))
                .times(0.5)
                .minus(this.camera.position).length;
            return dir1 - dir0;
        });
        this.lines.forEach(line=>{
            line.draw(this.camera);
        });
        // DRAW POINTS
        // SORT
        this.points.sort((p1, p2)=>{
            return this.camera.position.minus(p1).length - 
            this.camera.position.minus(p2).length;
        })
        // DRAW
        this.points.forEach(point=>{
            point.draw(this.camera);
        })

        // Вывод на экран текста
        this.texts.forEach(t=>{
            t.draw(this.camera);
        });
        this.texts = [];
        this.lines = [];
        this.points = [];

     }

     pushLine(start, end, color="#000", width=1) {
        if (start == null || end == null) 
            return;
        this.lines.push(new DrawableLine(start, end, color, width));
     }

     pushPoint(point, color="#000", r, isFill=true) {
        if (point == null)
            return null;
        this.points.push(new DrawablePoint(point.x, point.y, point.z, color, r, isFill));
     }
     pushText(text, point, dx,dy,color,fontSize) {
        if (point == null)
            return null;
        this.texts.push(new DrawableText(text,point, dx,dy, color,fontSize));

     }
    }

    Drawer.MAX_POINT_SIZE = 5;


    // Loop - для организации цикла отрисовки и обновления
    class Loop {

        // 
        constructor (update, draw) {
            this._update = update;
            this._draw = draw;
            this.lastTime = 0;
        }

        draw() {
            this._draw();
        }

        update(elapsedTime) {
            this._update(elapsedTime - this.lastTime);
            this.lastTime = elapsedTime;
        }
        tick(elapsedTime) {
            this.update(elapsedTime)
            this.draw();
            requestAnimationFrame((et)=>{ this.tick(et); });
        }
        start() {
            requestAnimationFrame((et)=>{ this.tick(et); });
        }
    }

    // D3DrawingLoop - Декоратор над классом Loop
    class D3DrawingLoop {
        constructor(camera, CTX, drawFunc, color=settings.CLEAR_COLOR, updateFunc=()=>{}) {
            this.camera = camera;
            this.drawer = new Drawer(camera);
            this.CTX = CTX;
            this.drawFunc = drawFunc;
            this.changed = true;
            this.bgcolor = color;
            this.updateFunc = updateFunc;
            this.loop = new Loop(updateFunc, ()=>{
                this.draw()
            })
            this.onChangeHandler = ()=>{
                this.changed = true;
            }
            this.playing = false;
        }
        start() {
            this.playing = true;
            this.loop.start()
        }
        stop() {
            this.playing = false;
        }
        draw() {
            if (!this.changed || !this.playing) {
                return
            }
            this.changed = false
            this.CTX.clearScreen(this.bgcolor);
            this.drawFunc(this.drawer);
            this.drawer.drawAll();
        }

    }
    // CameraMove - подмодуль, который реализует перемещение камеры в пространстве
    // в переменной CameraMove хранится конструктор класса CameraMove
    var CameraMove = (function (){
        class CameraMove {
            constructor(camera, handler, onChangeHandler=function(){}) {
                this.camera = camera;
                this.handler = (e)=>{
                    handler(e, this.camera);
                    this.onChangeHandler()
                }
                this.enabled = false;
                this.onChangeHandler = onChangeHandler;
            }
            turnOn() {
                if (this.enabled)
                    return;
                this.enabled = true;
                window.addEventListener("keydown", this.handler)
            }
            turnOff() {
                if (!this.enabled)
                    return;
                this.enabled = false;
                window.removeEventListener("keydown",this.handler);
            }
        }
        function setCameraPos(camera, pos, direction = pos.times(-1)) {
            camera.position = pos;
            camera.direction = direction;
        }
        function rotateXoY(camera, da) {
            camera.direction = camera.direction.rotateAroundZ(da);
        }
        function rotateUp(camera, beta) {
            let {x: dx, y: dy, z: dz} = camera.direction;
            if (Math.abs(dx) + Math.abs(dy) <= 1e-8) {
                return camera.direction = Point.K;
            }
            const sqrt = Math.sqrt(dx*dx + dy * dy)
            const alpha = Math.atan(dz / sqrt);
            const tan = Math.tan(alpha + beta);
            const k = tan * sqrt - dz;
            camera.direction = camera.direction.plus(Point.K.times(k));
        }

        // Движение вокруг вертикальной оси
        // Клавиши Вверх-вниз - перемещение вдоль взгляда камеры(вперёд или назад)
        // Клавиши влево-вправо - перемещение вокруг вертикальной оси
        // Shift+Вверх-вниз - Перемещение вдоль вертикальной оси(вверх, вниз)
        // Shift+Влево-вправо - поворот камеры вокруг своей оси(вокруг вектора Top)
        CameraMove.makeAroundHandler = function(center, velocity) {
            const forwardCoef = 1.0/10;
            const topCoef = 1.0/3;
            let isNeedPreventDeafult = function(e) {
                if (e.shiftKey) return true;
            }
            return (e, camera) => {
                if (isNeedPreventDeafult(e)) {
                    e.preventDefault();
                }
                if (!e.shiftKey) {
                    switch (e.key) {
                        case "ArrowUp":
                            setCameraPos(camera, camera.position.plus(camera.direction.times(velocity*forwardCoef)));
                            break;
                        case "ArrowDown":
                            setCameraPos(camera, camera.position.plus(camera.direction.times(-velocity*forwardCoef)));
                            break;
                        case "ArrowLeft":
                            setCameraPos(camera, camera.position.plus(camera.getRight().times(-velocity)));
                            break;
                        case "ArrowRight":
                            setCameraPos(camera, camera.position.plus(camera.getRight().times(velocity)));
                            break;
                    }
                } else {
                    switch (e.key) {
                        case "ArrowUp":
                            setCameraPos(camera, camera.position.plus(Point.K.times(velocity*topCoef)));
                            break;
                        case "ArrowDown":
                            setCameraPos(camera, camera.position.plus(Point.K.times(-velocity*topCoef)));
                            break;
                        case "ArrowLeft":
                            rotateXoY(camera, velocity);
                            break;
                        case "ArrowRight":
                            rotateXoY(camera, -velocity);
                            break;
                    }
                }
            }
        };
        CameraMove.makeSpaceMove = function(velocity) {
            return (e, camera) => {
                e.preventDefault();
                if (!e.shiftKey) {
                    switch (e.key) {
                        case "ArrowUp":
                            camera.position = camera.position.plus(camera.direction.times(velocity));
                            break;
                        case "ArrowDown":
                            camera.position = camera.position.plus(camera.direction.times(-velocity));
                            break;
                        case "ArrowLeft":
                            camera.position = camera.position.plus(camera.getRight().times(-velocity));
                            break;
                        case "ArrowRight":
                            camera.position = camera.position.plus(camera.getRight().times(velocity));
                            break;
                    }
                } else {
                    switch (e.key) {
                        case "ArrowUp":
                            rotateUp(camera,velocity);
                            break;
                        case "ArrowDown":
                            rotateUp(camera,-velocity);
                            break;
                        case "ArrowLeft":
                            rotateXoY(camera, velocity);
                            break;
                        case "ArrowRight":
                            rotateXoY(camera, -velocity);
                            break;
                    }
                }
            }
        };
        CameraMove.setCameraPos = setCameraPos;
        return CameraMove;
    })();

    // GetOriginDraw - отрисовывает шкалы координатных осей
    let GetOriginDraw = function(PointColor="crimson", LineColor="#369") {
        return function(drawer) {
            drawer.pushPoint(Point.I, PointColor);
            drawer.pushPoint(Point.J, PointColor);
            drawer.pushPoint(Point.K, PointColor);
            drawer.pushPoint(Point.I.times(2), PointColor);
            drawer.pushPoint(Point.J.times(2), PointColor);
            drawer.pushPoint(Point.K.times(2), PointColor);
            drawer.pushPoint(Point.I.times(3), PointColor);
            drawer.pushPoint(Point.J.times(3), PointColor);
            drawer.pushPoint(Point.K.times(3), PointColor);
            drawer.pushLine(Point.NULL, Point.I.times(1), LineColor);
            drawer.pushLine(Point.NULL, Point.K.times(1), LineColor);
            drawer.pushLine(Point.NULL, Point.J.times(1), LineColor);
            drawer.pushLine(Point.I.times(1), Point.I.times(2), LineColor);
            drawer.pushLine(Point.K.times(1), Point.K.times(2), LineColor);
            drawer.pushLine(Point.J.times(1), Point.J.times(2), LineColor);
            drawer.pushLine(Point.I.times(2), Point.I.times(3), LineColor);
            drawer.pushLine(Point.K.times(2), Point.K.times(3), LineColor);
            drawer.pushLine(Point.J.times(2), Point.J.times(3), LineColor);
            drawer.pushLine(Point.I.times(3), Point.I.times(4), LineColor);
            drawer.pushLine(Point.K.times(3), Point.K.times(4), LineColor);
            drawer.pushLine(Point.J.times(3), Point.J.times(4), LineColor);
            drawer.pushPoint(Point.NULL, PointColor);
        }
    }
    return {
        "WIDTH": WIDTH,
        "HEIGHT": HEIGHT,
        "canvas": canvas,
        "ctx": ctx,
        "CTX": CTX,
        "Point": Point,
        "Camera": Camera,
        "Drawer": Drawer,
        "isZero": isZero,
        "isFloatEqual": isFloatEqual,
        "Loop": Loop,
        "CameraMove": CameraMove,
        "setCameraPos": CameraMove.setCameraPos,
        "Interval": Interval,
        "gauss": gauss,
        "D3DrawingLoop":D3DrawingLoop,
        "GetOriginDraw":GetOriginDraw,
        "bezierCurve": bezier,
    };
});

console.log('3DLib loaded');