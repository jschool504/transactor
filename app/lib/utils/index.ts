export const log = (label) => (decoratedFn) => {
  return (event, context) => {

      console.log(label + ' input: ' + JSON.stringify(event))

      const result = decoratedFn(event, context)

      console.log(label + ' output: ' + JSON.stringify(result))

      return result
  }
}

export const memo = () => {
  const cache: { [k: string]: any } = {};
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const cacheKey = `__cacheKey__${args.toString()}`;
      if (!cache.hasOwnProperty(cacheKey)) {
        cache[cacheKey] = originalMethod.apply(this, args);
      }
      return cache[cacheKey];
    }
  }
}

export const measure = (
  target,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => {

  const originalMethod = descriptor.value

  descriptor.value = function (...args) {
    console.time(originalMethod.name)
    const result = originalMethod.apply(this, args)
    Promise.resolve(result).then(() => {
      console.timeEnd(originalMethod.name)
    }).catch(() => {
      console.timeEnd(originalMethod.name)
    })
    return result
  }

  return descriptor
}

export const format = (amountCents: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
  })

  return formatter.format(amountCents / 100)
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

// strip out all non-alpbetical characters and lowercase
export const convertNameToBudgetId = (name) => Array.from(name.toLowerCase())
    .filter((c: string) => ALPHABET.includes(c)).join('')

export const terminal = {
  log: console.log,
  error: console.error,
  info: console.info
}
