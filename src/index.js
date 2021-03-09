import './styles/main.scss'

console.log('entry point')

// создание свойства класса без конструктора
class Game {
  // name = 'Violin Charades'
  // name: 'Violin Charades'
}
const myGame = new Game()

// console.log(myGame);

console.log('12-33')

function bad(a) {
  console.log('ha h gg')
  return a + 2
}

const testObj = {
  one: 'odin',
  two: 'dva',
  three: 'tri',
}

for (const key of testObj) {
  console.log(key + ':' + testObj[key]) // original
  console.log(`${key  }:${  testObj[key]}`) // fixed by eslint
}

const one = testObj.one;

console.log(one)