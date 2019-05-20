(function ($) {
    $.fixedTable = new FixedTable();
    function FixedTable() {
        var self = this;
        var tableClasses = {
            fixedLeftHeader: 'qc-table-fixed-header',
            fixedLeftBody: ''
        }
        var _methods = {
            render: function () {
                self._render();
            },
            _render: function () {
                var element = self.element;
                var $element = $(element);
				$element.removeClass('hide')
                var headerDic = self._classifyHeaders($element);

                self._reRenderElement($element, headerDic);

                self._renderContainer($element, headerDic);
                return;
                var $fixedLeftTable = $element.clone();
                var $fixedRightTable = $element.clone();
                var $nofixedTable = $element.clone();
            },
            _reRenderElement: function ($element, headerDic) {
                var leftIdxs = headerDic['left'];
                var rightIdxs = headerDic['right'];
                var nofixedIdxs = headerDic['none'];
                var allIdxs = leftIdxs.concat(nofixedIdxs, rightIdxs);
                var $thRows = $element.find('thead>tr');
                $.each($thRows, function (i, thRow) {
                    var $thRow = $(thRow);
                    var $cloneThRow = $thRow.clone();
                    $thRow.empty();

                    var $ths = $cloneThRow.find('th');
                    var $newThs = [];
                    $.each(allIdxs, function (i, index) {
                        var th = $ths[index];
                        if (th) {
                            var $th = $(th);
                            $th.attr('index', index);
                            $newThs.push(th);
                        }
                    });
                    $thRow.append($newThs);
                });
                var $tdRows = $element.find('tbody>tr');
                $.each($tdRows, function (i, row) {
                    var $row = $(row);
                    var $cRow = $row.clone();
                    $row.empty();
                    $columns = $cRow.find('td');
                    var $newColumns = [];
                    $.each(allIdxs, function (i, index) {
                        var column = $columns[index];
                        if (column) {
                            var $column = $(column);
                            $column.attr('index', index);
                            $newColumns.push(column);
                        }
                    });
                    $row.append($newColumns);
                })
            },
            _classifyHeaders: function ($element) {
                var headerDic = {};
                var $headers = $element.find('thead > tr > th');
                var fixedLeftHeaders = [];
                var fixedRightHeaders = [];
                var noFixedHeaders = [];
                $.each($headers, function (index, header) {
                    var fixed = $(header).attr('fixed');
                    if (!fixed) {
                        noFixedHeaders.push(index);
                    } else if (fixed === 'left') {
                        fixedLeftHeaders.push(index);
                    } else if (fixed === 'right') {
                        fixedRightHeaders.push(index);
                    }
                });
                headerDic['left'] = fixedLeftHeaders;
                headerDic['right'] = fixedRightHeaders;
                headerDic['none'] = noFixedHeaders;
                return headerDic;
            },
            _renderContainer: function ($element, headerDic) {
                self.containerWidth = $element.parent().width();
                self.containerHeight = $element.parent().height();
                console.log(self.containerHeight);

                //用qc-table包含table
                $element.wrapAll('<div class="qc-table"></div>');
                var $jxTable = $element.parent();

                //用qc-table-wrapper包含qc-table
                $jxTable.wrapAll('<div class="qc-table-wrapper"></div>');
                var leftHeaders = headerDic['left'];
                var rightHeaders = headerDic['right'];
                var nofixedHeader = headerDic['none'];
                if (nofixedHeader.length) {
                    self._renderNofixedColumns($element, $jxTable, nofixedHeader);
                }
                if (leftHeaders.length) {
                    self._renderFixedLeftTable($element, $jxTable, leftHeaders);
                }

                if (rightHeaders.length) {
                    self._renderFixedRightTable($element, $jxTable, rightHeaders);
                }
                //$element.remove();
				$element.addClass('hide');
                self._registerScrollEvents($jxTable);

            },
            _renderNofixedColumns: function ($element, $jxTable, headerIndexes) {
                if (!headerIndexes.length) {
                    return;
                }
                var $headerTable = $element.clone();
                $headerTable.find('tbody').remove();
                var $bodyTable = $element.clone();
                $bodyTable.find('thead').remove();
                $headerTable.wrapAll('<div class="qc-table-header"></div>');
                $jxTable.append($headerTable.parent());
                $bodyTable.wrapAll('<div class="qc-table-body qc-table-overflowY qc-table-overflowX"></div>');
                $jxTable.append($bodyTable.parent());
                self._renderTable($headerTable, $bodyTable, headerIndexes);
            },
            _renderFixedLeftTable: function ($table, $jxTable, headers) {

                var $headerTable = $table.clone();
                $headerTable.find('tbody').remove();
                var $bodyTable = $table.clone();
                $bodyTable.find('thead').remove();
                $headerTable.wrapAll('<div class="qc-table-fixed-header"></div>')
                var $headerParent = $headerTable.parent();
                $headerParent.wrapAll('<div class="qc-table-fixed"></div>')
                $fixedContainer = $headerParent.parent();
                $bodyTable.wrapAll('<div class="qc-table-fixed-body"></div>')
                $fixedContainer.append($bodyTable.parent());
                $jxTable.append($fixedContainer);
                self._renderTable($headerTable, $bodyTable, headers, true);
            },
            _renderFixedRightTable: function ($table, $jxTable, headers) {
                var $headerTable = $table.clone();
                $headerTable.find('tbody').remove();
                var $bodyTable = $table.clone();
                $bodyTable.find('thead').remove();
                $headerTable.wrapAll('<div class="qc-table-fixed-header"></div>')
                var $headerParent = $headerTable.parent();
                $headerParent.wrapAll('<div class="qc-table-fixed-right"></div>')
                $fixedContainer = $headerParent.parent();
                $bodyTable.wrapAll('<div class="qc-table-fixed-body"></div>')
                $fixedContainer.append($bodyTable.parent());
                $jxTable.append($fixedContainer);
                self._renderTable($headerTable, $bodyTable, headers, true, true);
            },

            _renderTable: function ($headerTable, $bodyTable, headers, fixed, right) {
                var bodyHeight = $bodyTable.height();
                var headHeight = $headerTable.height();
                var isOverflowY = (bodyHeight + headHeight) > self.containerHeight;
                var isOverflowX = false;
                var $rows = $headerTable.find('thead>tr');
                var $colGroup = $('<colgroup></colgroup>');
                var $bodyColGroup = null;
                var tableWidth = 0;
                var parenWidth = 0
                $.each($rows, function (i, row) {
                    var $row = $(row);
                    var $cols = $row.find('th');
                    $colGroup = $('<colgroup></colgroup>');
                    parenWidth = 0;
                    var rowWidth = 1;
                    $.each($cols, function (idx, col) {
                        var $col = $(col);
                        var colWidth = $col.attr('width')
                        rowWidth += +(colWidth || 0);
                        var index = +$col.attr('index')
                        if (headers.indexOf(index) === -1) {
                            $col.addClass('qc-table-hidden');
                        } else {
                            parenWidth += parseInt(colWidth);
                            if (right) {
                                $row.prepend($col);
                            }
                        }
                        $colGroup.append($('<col width="' + colWidth + '"></col>'))
                    });
                    $bodyColGroup = $colGroup.clone();
                    if (isOverflowY) {
                        $row.append('<th class="qc-table-hidden" width="17" rowspan="1"></th>');
                        $colGroup.append($('<col width="17" class="for-scroll"></col>'))
                        rowWidth += 17;
                    }
                    if (right) {
                        var fixedCols = [];
                        var hiddenCols = [];
                        var $cloneGroup = $colGroup.clone();
                        $colGroup.empty();
                        var $children = $cloneGroup.children();
                        var fixedGroupCols = [];
                        var nofixedGroupCols = [];
                        $row.empty();
                        $.each($cols, function (i, col) {
                            if ($(col).hasClass('qc-table-hidden')) {
                                hiddenCols.push(col);
                                nofixedGroupCols.push($children.eq(i));
                            } else {
                                fixedCols.push(col);
                                fixedGroupCols.push($children.eq(i));
                            }
                        });
                        var newCols = fixedCols.concat(hiddenCols);
                        $row.append(newCols);
                        var newGroupCols = fixedGroupCols.concat(nofixedGroupCols);
                        $colGroup.append(newGroupCols);
                    }
                    tableWidth = Math.max(tableWidth, rowWidth);
                });
                $headerTable.css('width', tableWidth);
                $headerTable.prepend($colGroup.clone());

                var $bRows = $bodyTable.find('tbody>tr');
                $.each($bRows, function (i, row) {
                    var $row = $(row);
                    var $cols = $row.find('td');
                    $.each($cols, function (idx, col) {
                        var $col = $(col);
                        var index = parseInt($col.attr('index'));
                        if (headers.indexOf(index) === -1) {
                            $col.addClass('qc-table-hidden');
                        }
                    });
                    if (right) {
                        var fixedCols = [];
                        var hiddenCols = [];
                        // var $cloneRow = $row.clone();
                        $row.empty();
                        // var $cloneGroup = $colGroup.clone();
                        // $colGroup.empty();
                        // var $children = $cloneGroup.children();
                        // var fixedGroupCols = [];
                        // var nofixedGroupCols = [];
                        $.each($cols, function (i, col) {
                            if ($(col).hasClass('qc-table-hidden')) {
                                hiddenCols.push(col);
                                // nofixedGroupCols.push($children.eq(i));
                            } else {
                                fixedCols.push(col);
                                // fixedGroupCols.push($children.eq(i));
                            }
                        });
                        var newCols = fixedCols.concat(hiddenCols);
                        $row.append(newCols);
                        // var newGroupCols = fixedGroupCols.concat(nofixedGroupCols);
                        // $colGroup.append(newGroupCols);
                    }
                })

                $bodyTable.css('width', isOverflowY ? tableWidth - 17 : tableWidth);
                if (isOverflowY) {
                    $colGroup.children().last().remove();
                }
                $bodyTable.prepend($colGroup.clone());
                isOverflowX = tableWidth > self.containerWidth;
                if (fixed) {
                    $headerTable.parent().css('width', parenWidth);
                    $bodyTable.parent().css('width', parenWidth);
                } else {

                    if (isOverflowX) {
                        $bodyTable.parent().addClass('qc-table-overflowX')
                    } else {
                        $bodyTable.parent().removeClass('qc-table-overflowX')
                    }
                    if (isOverflowY) {
                        $bodyTable.parent().addClass('qc-table-overflowY')
                    } else {
                        $bodyTable.parent().removeClass('qc-table-overflowY')
                    }
                }

                if (isOverflowY) {
                    var calcedHeight = self.containerHeight - headHeight - 4;
                    if (fixed) {
                        if (isOverflowX) {
                            calcedHeight -= 17;
                        }
                    }
                    $bodyTable.parent().css('height', calcedHeight);

                    $bodyTable.closest('.qc-table').append('<div class="qc-table-fixed-right-header" style="width: 17px;height: 100%;"></div>');
                }

                if (right) {
                    $headerTable.closest('.qc-table-fixed-right').css('right', 17)
                }
            },
            _registerScrollEvents: function ($jxTable) {
                var overflowyEl = $jxTable.find(".qc-table-overflowY")[0];
                var overflowxEl =$jxTable.find(".qc-table-overflowX")[0];
                var overflowHeader = $jxTable.find(".qc-table-header")[0];
                var overflowLeft = $jxTable.find(".qc-table-fixed .qc-table-fixed-body")[0];
                var overfowRight = $jxTable.find(".qc-table-fixed-right .qc-table-fixed-body")[0];
                if (overflowyEl) {
                    overflowyEl.addEventListener("scroll", function () {
                        overflowLeft.scrollTop = overflowyEl.scrollTop;
                        overfowRight.scrollTop = overflowyEl.scrollTop;
                    });
                }
                if (overflowxEl) {
                    overflowxEl.addEventListener("scroll", function () {
                        overflowHeader.scrollLeft = overflowxEl.scrollLeft;
                    });
                }
            },
        };
        $.extend(self, _methods);

    }

    //如果传options fixedtable会以高级渲染方式去渲染、
    //options中需要包含 data，columndefs
    //columndefs格式：{title: 'test', field: ''}
    //如果不传options, 作用对象为以渲染的table
    $.fn.fixedTable = function () {
        $.fixedTable.element = this;
        $.fixedTable.render();
    }
})($);