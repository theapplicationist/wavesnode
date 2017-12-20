var colors = ['red', 'green', 'blue', 'orange', '#f06']

$(document).ready(function () {
  var columnDefinitions = [
    {
      title: "",
      targets: 0,
      width: 40,
      data: "branch",
      searchable: false,
      sortable: false,
      render: function (data, type, row, meta) {

        var r = ""
        for (var i = 0; i <= data.total; i++) {
          var x = 8 + 40 * i
          var cx = 10 + 40 * i
          var c = ''
          var color = colors[i % colors.length]
          if (i == data.pos)
            c = `<circle r="7" cx="${cx}" cy="22" fill="#FFFFFF" stroke="${color}" stroke-width="3"></circle>`

          r += `
          <rect x="${x}" y="0" width="4" height="40" fill="${color}"></rect>
          ${c}
          `
        }

        return `
        <div>
          <svg style="margin-top:-10px;padding:0;margin-bottom:-10px" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" height="40" width="${40 * i}">
            ${r}
          </svg>
        </div>
        `
      }
    },
    {
      title: "height",
      targets: 1,
      data: "height",
      searchable: true,
      sortable: false,
      render: function (data, type, row, meta) {
        return `${data}`
      }
    },
    {
      title: "id",
      targets: 2,
      data: "id",
      sortable: false,
      render: function (data, type, row, meta) {
        return `<a href='http://testnet.wavesexplorer.com/blocks/s/${data}'>${data}</a>`
      }
    },
    {
      title: "Who knows about this block?",
      targets: 3,
      data: "owners",
      visible: false,
      sortable: false,
      render: function (data, type, row, meta) {
        var s = []
        for (var o in data)
          s.push(o)
        return s.join(', ')
      }
    }
  ]

  var table = $('#Table').DataTable({
    paging: false,
    columnDefs: columnDefinitions,
    order: [[1, 'dsc']]
  });

  var blocksByHeight = {}
  var rowHeight = 10
  var dotRadius = 5

  if ("WebSocket" in window) {
    var ws = new WebSocket("ws://localhost:8080/");

    ws.onopen = function () {
    };

    ws.onmessage = function (evt) {
      var data = evt.data
      blocksByHeight = JSON.parse(data)
      var keys = Object.keys(blocksByHeight)
      var maxH = keys[keys.length - 1]
      console.log("new data: maxH => " + maxH)
      //render(maxH - 50, maxH, blocksByHeight)

      var blocks = []
      var branches = []

      var addBlock = b => {
        var branch = branches.find(br => (br.parent == b.id || br.blocks[b.id]) ? true : false)
        if (branch) {
          branches.filter(br => br.parent == b.id && br.id != branch.id).forEach(br => br.closed = b.height)
        }
        var activeBranches = branches.filter(br => br.closed < b.height && br != branch)
        if (!branch) {
          branch = { id: branches.length, blocks: {}, closed: 0, position: activeBranches.length }
          branches.push(branch)
        }
        branch.blocks[b.id] = 1
        branch.parent = b.parent
        b.branch = { id: branch.id, pos: branch.position, total: activeBranches.length }
        blocks.push(b)
      }

      keys.reverse()
      keys.forEach(h => {
        for (var b in blocksByHeight[h]) {
          var block = blocksByHeight[h][b]
          if(false)
          for (var i = 0; i < 3; i++) {
            if (Math.random() > 0.5) {
              var copy = {}
              copy.id = block.id + i
              copy.parent = block.parent + i
              copy.owners = block.owners
              copy.height = block.height
              addBlock(copy)
            }
          }
          addBlock(block)
        }
      })

      //blocks = blocks.filter(b => Object.keys(branches[b.branch.id].blocks).length > 1)

      table.clear()
      for (var i = 0; i < blocks.length; i++){
          
          table.row.add(blocks[i])
      }
      table.draw()
    };

    ws.onclose = function () {
    };

    window.onbeforeunload = function (event) {
      socket.close()
    };
  }

});