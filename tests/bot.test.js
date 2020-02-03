const BOT= require('../functions/bot');

// mocks & stubs
const EVENT_STUB = {
  body: {
    space: {
      name: 'space/test'
    }
  },
  headers: {
    'user-agent': 'Google-Dynamite'
  }
};
const FnMock = jest.fn((unknown, result) => result);

beforeEach(() => {
  process.env.space_test = {};
});

test('it throws 500 when requested client is not google chat', () => {
  const stub_copy = Object.assign({}, EVENT_STUB);
  // change user agent
  stub_copy.headers['user-agent'] = 'slack';

  BOT.handler(stub_copy, null, FnMock);
  expect(FnMock.mock.results[0].value.statusCode).toBe(500);
});

// test('it throws 500 when invoked without valid google chat header', () => {
//   let event_stub = Object.assign({}, EVENT_STUB);
//   console.log(event_stub);
//   // event_stub.headers['user-agent'] = 'Invalid';
//   BOT.handler(event_stub, null, FnMock)
//   expect(FnMock.mock.results[0].value.statusCode).toBe(500);
// });