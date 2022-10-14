import './styles/main.scss';
import './js/scripts';
import './js/test';

console.log('entry point');

// создание свойства класса без конструктора
// class Game {
//   // name = 'Violin Charades'
//   // name: 'Violin Charades'
// }
// const myGame = new Game();

// console.log(myGame);

console.log('12-33');

// function bad(a) {
//   console.log('WHYYYYYYYYYY??????!?!?!?!?!');
//   return a + 2;
// }

const a2 = 5;

console.log(a2);

const testObj = {
  one: 'odin',
  two: 'dva',
  three: 'tri',
};

// for (const key of testObj) {
//   console.log(`${key}:${testObj[key]}`); // original
//   console.log(`${key}:${testObj[key]}`); // fixed by eslint
// }

const { one } = testObj;

console.log(one);
