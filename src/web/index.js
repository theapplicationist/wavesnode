var colors = ['red', 'green', 'blue', 'orange', '#f06', 'chartreuse', 'brown', 'coral', 'cyan', 'darkred']
var prevRow = undefined
var searchIsActive = false

var widthPerBranch = 40
var heightPerRow = 27
var marginVertical = 300
var marginHorizontal = 200
var thickness = 3
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
  if (dotted)
    d = 'stroke-dasharray="5, 2"'

  canvas.value += `<line x1="${xB}" y1="${center - (height * heightPerRow - dotRadius - thickness) + 1}" x2="${xA}" y2="${center}" style="stroke:${color};stroke-width:${thickness}" ${d} />`
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
        var a = row
        var canvas = { value: '' }
        var me = data.all[data.me]
        var color = colors[me.branch % colors.length]

        if (prevRow) {
          for (var i = 0; i < prevRow.all.length; i++) {
            var element = prevRow.all[i];
            if (element.parent == me.signature || element.branch == me.branch) {
              var childIndex = i
              var afterMe = childIndex
              var beforeMe = data.all.length - (data.me + 1)
              var lineColor = colors[element.branch % colors.length]
              drawLine(canvas, data.me, lineColor, 1 + afterMe + beforeMe, childIndex, element.height - me.height > 1)
            }
          }
        }

        drawDot(canvas, data.me, color)

        if (data.me == 0)
          prevRow = data

        return `
        <div style="pointer-events: none;">
          <svg style="margin-top:-${marginVertical}px;margin-bottom:-${marginVertical}px;padding:0;margin-right:-${marginHorizontal};" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" height="${marginVertical * 2 + 20}" width="${widthPerBranch * data.all.length + marginHorizontal}">
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
      width: 100,
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
  var background = ''
  var lastCreatedRowHeight
  var table = $('#Table').DataTable({
    paging: false,
    columnDefs: columnDefinitions,
    order: [[1, 'dsc']],
    createdRow: function (row, data, dataIndex) {
      if (!lastCreatedRowHeight || lastCreatedRowHeight != data.height) {
        if (background == '')
          background = '#eff1f4'
        else background = ''
      }
      $(row).css('background-color', background)
      lastCreatedRowHeight = data.height
    }
  });

  var blocksByHeight = {}
  var keys = []
  var rowHeight = 10
  var dotRadius = 5

  function renderTable(collapsed) {
    table.clear()
    prevRow = undefined

    keys.forEach(h => {
      const currentBlocks = blocksByHeight[h]
      if (!collapsed || currentBlocks.filter(b => !b.collapsable).length > 0)
        for (let j = currentBlocks.length - 1; j >= 0; j--) {
          const block = currentBlocks[j]
          table.row.add(block)
        }
    })


    table.draw()
  }

  $('#collapseButton').click(function () {
    renderTable(true)
  });

  $('#Table_filter').hide()

  $('#Table_filter input').on('input', function (e) {
    searchIsActive = $(this).val().length > 0
    //renderTable(true)
  });

  $.getJSON('http://localhost:3000/blocks', function (data) {

    blocksByHeight = data
    keys = Object.keys(blocksByHeight)
    var maxH = keys[keys.length - 1]
    console.log("new data: maxH => " + maxH)
    //render(maxH - 50, maxH, blocksByHeight)

    var blocks = []
    var branches = []

    keys.reverse()
    keys.forEach(h => {
      const currentBlocks = blocksByHeight[h]
      const previousBlocks = blocksByHeight[(parseInt(h) + 1).toString()]
      for (let j = currentBlocks.length - 1; j >= 0; j--) {
        const block = currentBlocks[j]
        let isClosingBlock = false
        if (previousBlocks && h != keys[keys.length - 1]) {
          const children = previousBlocks.filter(b => b.parent == block.signature)
          children.filter(c => c.branch != block.branch).forEach(c => c.collapsable = false)
          if (children.length == 1 && children[0].branch == block.branch) {
            block.collapsable = true
          }
        }
        block.draw = { me: j, all: currentBlocks }
      }
    })

    renderTable()
  })
});