# InfinityScroll

A JavaScript library for creating truly infinite scroll lists of any size without browser limitations.

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://iscroll.qoobeo.ru/demo/)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://iscroll.qoobeo.ru/download/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![GitHub](https://img.shields.io/github/stars/A64Danil/InfinityScroll?style=social)](https://github.com/A64Danil/InfinityScroll)


## Description

InfinityScroll solves a fundamental problem with web browsers that have a container height limit of 33,554,400px, which restricts scrollable list sizes. This library eliminates this limitation and enables working with lists containing millions of elements.

## Use Cases

- 🛍️ Large product catalogs
- 📰 News feeds and social media streams
- 🔍 Search results with thousands of records
- 📊 Any interfaces with large datasets

## Installation

### Via CDN

```html
<script src="https://iscroll.qoobeo.ru/js/infinityScroll-2.0.0.js"></script>
```

**Download:**
[Download the script](https://iscroll.qoobeo.ru/js/infinityScroll-2.0.0.js) and include it in your project.

### Basic Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>InfinityScroll Demo</title>
    <script src="https://iscroll.qoobeo.ru/js/infinityScroll-2.0.0.js"></script>
</head>
<body>
    <div id="my-list"></div>
    
    <script src="infinity-scroll.js"></script>
    <script>
        const config = {
            data: (start, end) => 
                `http://localhost:3000/data?_start=${start}&_end=${end}`,
            selectorId: 'my-list',
            forcedListLength: 1000,
            listType: 'list',
            listWrapperHeight: '400px',
            templateString: (element, listLength, elemNum) => `
                <li class="list-item">
                    ${element.name} - ${element.description}
                </li>
            `
        };
        
        new InfinityScroll(config);
    </script>
</body>
</html>
```

## Configuration

### Configuration Object

```typescript
interface InfinityScrollConfig {
    data: object[] | DataURLType | ((start: number, end: number) => string);
    selectorId: string;
    templateString: (
        element: { [key: string]: unknown },
        listLength?: number,
        elemNum?: number
    ) => string;
    listWrapperHeight?: string;
    forcedListLength?: number;
    listType?: 'list' | 'table' | 'div';
    tHeadNames?: string[];
    subDir?: string;
    templateCb?: Record<string, (arg: any) => any>;
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data` | `Array \| string \| Function` | ✅ | Data source - array, URL string, or function returning URL |
| `selectorId` | `string` | ✅ | ID of the container element |
| `templateString` | `function` | ✅ | Function returning HTML template for each item |
| `listWrapperHeight` | `string` | ❌ | Height of scrollable container (e.g., '350px') |
| `forcedListLength` | `number` | ❌ | Manually set list length to limit or accelerate initialization |
| `listType` | `'list' \| 'table' \| 'div'` | ❌ | Container type (default: 'list') |
| `tHeadNames` | `string[]` | ❌ | Column headers for table mode |
| `subDir` | `string` | ❌ | Property name for nested array in API response |
| `templateCb` | `object` | ❌ | Custom template callback functions |
| `isDebugMode` | `boolean` | ❌ | Enable debug mode (feature in progress) |


- **`data`** (required): Data source - can be an array of objects, URL template function, or DataURL type
- **`selectorId`** (required): ID of the container element
- **`templateString`** (required): Function that returns HTML template for each list item
- **`listWrapperHeight`** (optional): Height of the scrollable container (e.g., '290px')
- **`forcedListLength`** (optional): Total number of items in the list
- **`listType`** (optional): Type of list container - 'list', 'table', or 'div'
- **`subDir`** (optional): Subdirectory path for resources

### Template Function

The `templateString` function receives three parameters:

```javascript
templateString: ({item, listLength, templateCb, idx}) => `
    <li class="list-item">
        <strong>${item.name}</strong>
        <span>Item ${idx} of ${listLength}</span>
    </li>
```

## Examples

### Remote Data Loading

```javascript
const REMOTE_LAZY_CONFIG = {
    data: (start, end) =>
        `http://localhost:3000/data?_start=${start}&_end=${end}`,
    selectorId: 'REMOTE_LAZY_CONTAINER',
    forcedListLength: 500,
    listType: 'list',
    listWrapperHeight: '290px',
    templateString: (element, listLength) => `
        <li class="list-item big">
            ${element?.number} ${element?.name}
        </li>
    `,
};

new InfinityScroll(REMOTE_LAZY_CONFIG);
```

### Static Data Array

```javascript
const STATIC_DATA_CONFIG = {
    data: [
        { id: 1, name: 'Item 1', description: 'Description 1' },
        { id: 2, name: 'Item 2', description: 'Description 2' },
        // ... more items
    ],
    selectorId: 'static-list',
    listType: 'div',
    listWrapperHeight: '400px',
    templateString: (element) => `
        <div class="item">
            <h3>${element.name}</h3>
            <p>${element.description}</p>
        </div>
    `,
};

new InfinityScroll(STATIC_DATA_CONFIG);
```

### Table Format

```javascript
const TABLE_CONFIG = {
    data: (start, end) => `/api/users?start=${start}&end=${end}`,
    selectorId: 'users-table',
    listType: 'table',
    listWrapperHeight: '500px',
    forcedListLength: 10000,
    templateString: (element) => `
        <tr>
            <td>${element.id}</td>
            <td>${element.name}</td>
            <td>${element.email}</td>
        </tr>
    `,
};

new InfinityScroll(TABLE_CONFIG);
```

## Demo

Visit the [demo page](https://iscroll.qoobeo.ru/demo/index.html) to see InfinityScroll in action.


## 🌐 Browser Support

| Browser | Supported Versions |
|---------|-------------------|
| Chrome | ✅ 60+ |
| Firefox | ✅ 55+ |
| Safari | ✅ 12+ |
| Edge | ✅ 79+ |
| IE | ❌ Not supported |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](https://github.com/A64Danil/InfinityScroll?tab=ISC-1-ov-file#readme) file for details.


## Author

**A64Danil** - [GitHub](https://github.com/A64Danil)

## Contact

If you have questions or suggestions, please create an Issue in the repository.

---

⭐ Star this project if it was helpful!