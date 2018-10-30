function replacer(key: string, value: any) {
  if (value instanceof RegExp) return '__REGEXP ' + value.toString();
  return value;
}

function reviver(key: string, value: any) {
  if (value && value.toString && value.toString().indexOf('__REGEXP ') == 0) {
    var m = value.split('__REGEXP ')[1].match(/\/(.*)\/(.*)?/);
    return new RegExp(m[1], m[2] || '');
  }
  return value;
}

export const stringify = (o: any) => JSON.stringify(o, replacer);
export const parse = (o: any) => JSON.parse(o, reviver);
