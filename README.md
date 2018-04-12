# WavesNode

NodeJS Implementation of the Waves Node TCP Layer

## Getting Started

```
npm install

gulp
```

### ObservableNodeConnection Examples

``` javascript
ObservableNodeConnection('localhost', 6868, 'W').subscribe(x => {
  wss.broadcast(JSON.stringify(x));

  
}, 
e => { console.log(e)})
```

