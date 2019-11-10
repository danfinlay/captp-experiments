const test = require('tape')
const { E, harden, makeCapTP } = require('@agoric/captp');

test('try loopback captp', async t => {

  try {
    const debug = false;
    let rightDispatch;
    const { dispatch: leftDispatch, getBootstrap: leftBootstrap } = makeCapTP(
      'left',
      obj => {
        if (debug) {
          console.log('toRight', obj);
        }
        rightDispatch(obj);
      },
    );
    const pr = {};
    pr.p = new Promise((resolve, reject) => {
      pr.res = resolve;
      pr.rej = reject;
    });
    ({ dispatch: rightDispatch } = makeCapTP(
      'right',
      obj => {
        if (debug) {
          console.log('toLeft', obj);
        }
        leftDispatch(obj);
      },
      harden({
        promise: pr.p,
        encourager: {
          encourage(name) {
            const bang = new Promise(resolve => {
              setTimeout(
                () =>
                  resolve({
                    trigger() {
                      return `${name} BANG!`;
                    },
                  }),
                200,
              );
            });
            return { comment: `good work, ${name}`, bang };
          },
        },
      }),
    ));
    const rightRef = leftBootstrap();
    const { comment, bang } = await E.C(rightRef).G.encourager.M.encourage(
      'buddy',
    ).P;
    t.equal(comment, 'good work, buddy', 'got encouragement');
    t.equal(await E(bang).trigger(), 'buddy BANG!', 'called on promise');
    pr.res('resolution');
    t.equal(await E.G(rightRef).promise, 'resolution', 'got resolution');
    t.equal(await E.C(rightRef).G.promise.P, 'resolution', 'chained resolution');
  } catch (e) {
    t.isNot(e, e, 'unexpected exception');
  } finally {
    t.end();
  }
});