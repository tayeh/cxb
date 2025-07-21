export function isDeepEqual(x, y) {
  if (x === y) {
    return true;
  } else if (
    typeof x == "object" &&
    x != null &&
    typeof y == "object" &&
    y != null
  ) {
    if (Object.keys(x).length != Object.keys(y).length) {
      return false;
    }

    for (var prop in x) {
      if (y.hasOwnProperty(prop)) {
        if (!isDeepEqual(x[prop], y[prop])) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  } else {
    return false;
  }
}

export const removeEmpty = (obj) => {
  let newObj = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] === Object(obj[key])) newObj[key] = removeEmpty(obj[key]);
    else if (
        obj[key] !== undefined &&
        obj[key] !== null &&
        typeof obj[key] === "string" &&
        obj[key].trim().length != 0
    ) {
      newObj[key] = obj[key];
    } else if (
        obj[key] !== undefined &&
        obj[key] !== null &&
        typeof obj[key] !== "string"
    ) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

const d = [
  {
    "resource_type": "space",
    "shortname": "website",
    "subpath": "/",
    "attributes": {
      "is_active": true,
      "slug": null,
      "displayname": {
        "en": null,
        "ar": null,
        "ku": null
      },
      "description": {
        "en": null,
        "ar": null,
        "ku": null
      }
    }
  }
]
console.log(removeEmpty(d));