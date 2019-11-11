const test = require('tape')
const { E, harden, makeCapTP } = require('@agoric/captp');

test('pizza ordering example', async t => {
  /*
  * Let's say a customer wants to say "What's your largest pizza? GIMME THAT!"
  * In a single request, from a pizza service.
  * 
  * In this example, we're going to have two capTp instances: customer, and pizzeria.
  */

  try {
    const debug = false;
    let pizzeriaDispatch;

    // CREATE THE CUSTOMER:
    const { dispatch: customerDispatch, getBootstrap: pizzeriaBootstrap } = makeCapTP(
      'customer',
      obj => {
        if (debug) {
          console.log('to pizzeria:', obj);
        }
        pizzeriaDispatch(obj);
      },
    );

    // CREATE THE PIZZERIA:
    ({ dispatch: pizzeriaDispatch } = makeCapTP(
      'right',
      obj => {
        if (debug) {
          console.log('to customer:', obj);
        }
        customerDispatch(obj);
      },
      harden({
        getPizzaSizes: async () => ['smallza', 'mediumoni', 'largiosa'],
        orderPizza: async (size) => { return { cooking: true, size } },
      }),
    ));

    // THE TESTS:
    const pizzeriaRef = pizzeriaBootstrap();
    const { cooking, size } = await E(pizzeriaRef).getPizzaSizes()
      .then(sizes => sizes[sizes.length - 1])
      .then(E(pizzeriaRef).orderPizza)

    t.ok(cooking, 'is cooking')
    t.equal(size, 'largiosa', 'the biggest kind')

  // HANDLE ERRORS:
  } catch (e) {
    t.isNot(e, e, 'unexpected exception');
  } finally {
    t.end();
  }
});