var colors = ['red', 'green', 'blue', 'orange', '#f06', 'chartreuse', 'brown', 'coral', 'cyan', 'darkred']
var prevRow

var widthPerBranch = 40
var heightPerRow = 40
var marginVertical = 300
var marginHorizontal= 200
var thickness = 4
var dotRadius = 6

function drawDot(canvas, offset, color) {
  var cx = 10 + widthPerBranch * offset
  canvas.value += `<circle r="${dotRadius}" cx="${cx}" cy="${(marginVertical * 2 + 20) / 2 + thickness / 2}" fill="#FFFFFF" stroke="${color}" stroke-width="${thickness}"></circle>`
}

function drawLine(canvas, offetA, color, height, offetB, dotted = false) {
  var xA = 10 + 40 * offetA
  var xB = 10 + 40 * offetB
  var center = (marginVertical * 2 + 20) / 2
  var d = ''
  if(dotted)
  d = 'stroke-dasharray="5, 2"'

  canvas.value += `<line x1="${xB}" y1="${center - (height * heightPerRow - dotRadius - thickness) + 2}" x2="${xA}" y2="${center}" style="stroke:${color};stroke-width:${thickness}" ${d} />`
}

$(document).ready(function () {
  var columnDefinitions = [
    {
      title: "",
      targets: 0,
      width: 40,
      data: "draw",
      searchable: false,
      sortable: false,
      render: function (data, type, row, meta) {

        if(data.all[data.me].signature == 'FAKE_BLOCK_1a5e3990-2e85-4c1d-83ed-73bcbe502af2')
        {
          var a = 0
        }

        var canvas = { value: '' }
        var me = data.all[data.me]
        var color = colors[me.branch % colors.length]

        if (prevRow) {
          for (var i = 0; i < prevRow.all.length; i++) {
            var element = prevRow.all[i];
            if(element.parent == me.signature) {
              var childIndex = i
                var afterMe = childIndex
                var beforeMe = data.all.length - (data.me + 1)
                var lineColor = colors[element.branch % colors.length]
                
                drawLine(canvas, data.me, lineColor, 1 + afterMe + beforeMe, childIndex, element.branch != me.branch)
            }
          }

        }

        drawDot(canvas, data.me, color)

        if(data.me == 0)
          prevRow = data

        return `
        <div>
          <svg style="margin-top:-${marginVertical}px;margin-bottom:-${marginVertical}px;padding:0;margin-right:-${marginHorizontal}" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" height="${marginVertical * 2 + 20}" width="${widthPerBranch * data.all.length + marginHorizontal}">
            ${canvas.value}
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
      title: "signature",
      targets: 2,
      data: "signature",
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

  $.getJSON('http://localhost:3000/', function (data) {

    blocksByHeight = data
    var keys = Object.keys(blocksByHeight)

    var maxH = keys[keys.length - 1]
    console.log("new data: maxH => " + maxH)
    //render(maxH - 50, maxH, blocksByHeight)

    var blocks = []
    var branches = []

    var addBlock = b => {
      var branch = branches.find(br => (br.parent == b.signature || br.blocks[b.signature]) ? true : false)
      if (branch) {
        branches.filter(br => br.parent == b.signature && br.signature != branch.signature).forEach(br => br.closed = b.height)
      }
      var activeBranches = branches.filter(br => br.closed < b.height && br != branch)
      if (!branch) {
        branch = { id: branches.length, blocks: {}, closed: 0, position: activeBranches.length }
        branches.push(branch)
      }
      branch.blocks[b.signature] = 1
      branch.parent = b.parent
      b.branch = { id: branch.id, pos: branch.position, total: activeBranches.length }
      blocks.push(b)
    }

    keys.reverse()
    keys.forEach(h => {
      for (let j = blocksByHeight[h].length - 1; j >= 0; j--) {
        const block = blocksByHeight[h][j];
        block.draw = { me: j, all: blocksByHeight[h] }
        blocks.push(block)
      }
    })

    //blocks = blocks.filter(b => Object.keys(branches[b.branch.id].blocks).length > 1)

    table.clear()
    for (var i = 0; i < blocks.length; i++) {
      table.row.add(blocks[i])
    }
    table.draw()

  })
});