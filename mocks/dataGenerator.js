import fs from 'fs';

const MAX = 100;
const PATH = `mocks/bigList${MAX}.json`;
console.log(`Soon you wil have data json with MAX = ${MAX}`);

const mockJson = {
  data: [
    {
      name: 'Random',
      number: 0,
    },
  ],
};

for (let i = 0; i < MAX; i++) {
  const tempData = {
    name: 'Element',
    number: i + 1,
  };
  mockJson.data.push(tempData);
}

console.log(mockJson.data);

// eslint-disable-next-line consistent-return
fs.writeFile(PATH, JSON.stringify(mockJson), (err) => {
  if (err) {
    return console.error(err);
  }

  console.log('Data written successfully!');
  console.log("Let's read newly written data");
});
