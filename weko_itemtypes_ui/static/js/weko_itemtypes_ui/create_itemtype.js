  require([
    "jquery",
    "bootstrap"
  ],function() {
    page_global = {
      table_row: [],        // 追加した行番号を保存する(元々順番)
      table_row_map: {},    // 生成したschemaとformの情報を保存する
      meta_list: {},        // 追加した行の情報を保存する(セットした詳細情報)
      schemaeditor: {       // objectの場合
        schema:{}           //   生成したschemaの情報を保存する
      }
    }
    page_json_editor = {}   //   一時的editorオブジェクトの保存
    url_update_schema = '/itemtypes/register';
    mapping_value = {
      "display_lang_type": "",
      "dublin_core_mapping": "",
      "jpcoar_mapping": "",
      "junii2_mapping": "",
      "lido_mapping": "",
      "lom_mapping": "",
      "spase_mapping": ""
    }


    $('#myModal').modal({
      show: false
    })

    if($('#item-type-lists').val().length > 0) {
      // バージョンアップ
      $('#upt_version').attr('checked', true);
      $('#new_version').attr('checked', false);
      itemname = $('#item-type-lists').find("option:selected").text();
      itemname = itemname.substr(0,itemname.lastIndexOf('('));
      $('#itemtype_name').val(itemname);
      url_update_schema = '/itemtypes/'+$('#item-type-lists').val()+'/register';
    }

    $('.radio_versionup').on('click', function(){
      if($(this).val() == 'upt') {
        //$('#itemtype_name').val($('#item-type-lists').find("option:selected").text());
        url_update_schema = '/itemtypes/'+$('#item-type-lists').val()+'/register';
      } else {
        url_update_schema = '/itemtypes/register';
      }
    });

    $('#item-type-lists').on('change', function(){
      window.location.href = '/itemtypes/' + $('#item-type-lists').val();
    });

    $('#btn_create_itemtype_schema').on('click', function(){
      if($('#itemtype_name').val() == "") {
        $('#itemtype_name_warning').removeClass('hide');
        $('#itemtype_name').focus();
        return;
      }
      $('#itemtype_name_warning').addClass('hide');
      create_itemtype_schema();
      send(url_update_schema, page_global);
    });

    $('#btn_previews_itemtype_schema').on('click', function(){
      create_itemtype_schema();
      $('#schema_json').text(JSON.stringify(page_global.table_row_map.schema, null, 4));
      $('#form_json').text(JSON.stringify(page_global.table_row_map.form, null, 4));
      $('#render_json').text(JSON.stringify(page_global, null, 4));
    });

    function create_itemtype_schema(){
      page_global.table_row_map['name'] = $('#itemtype_name').val();
      page_global.table_row_map['action'] = $('[name=radio_versionup]:checked').val();
      page_global.table_row_map['mapping'] = {};
      page_global.table_row_map['form'] = [];
      page_global.table_row_map['schema'] = {
        $schema: "http://json-schema.org/draft-04/schema#",
        type: "object",
        description: "",
        properties: {},
        required: []
      };

      // タイトルなどを追加する
      page_global.table_row_map.schema.properties["title_ja"] = {type:"string",title:"タイトル",format:"text"}
      page_global.table_row_map.schema.properties["title_en"] = {type:"string",title:"タイトル(英)",format:"text"}
      page_global.table_row_map.form.push({type:"fieldset",title:"タイトル",items:[{type:"text",key:"title_ja",title:"タイトル",required:true},{type:"text",key:"title_en",title:"タイトル(英)",required:true}]});
      page_global.table_row_map.schema.properties["lang"] = {type:"string",title:"言語",format:"text"}
      page_global.table_row_map.form.push({key:"lang",type:"text",title:"言語","required": true});
      page_global.table_row_map.schema.properties["pubdate"] = {type:"string",title:"公開日",format:"datetime"}
      page_global.table_row_map.form.push({key:"pubdate",type:"template",title:"公開日","required": true,"format": "yyyy-MM-dd","templateUrl": "/static/templates/weko_deposit/datepicker.html"});
      page_global.table_row_map.schema.properties["keywords"] = {type:"string",title:"キーワード",format:"text"}
      page_global.table_row_map.schema.properties["keywords_en"] = {type:"string",title:"キーワード(英)",format:"text"}
      page_global.table_row_map.form.push({type:"fieldset",title:"キーワード",items:[{type:"text",key:"keywords",title:"キーワード"},{type:"text",key:"keywords_en",title:"キーワード(英)"}]});
      page_global.table_row_map.schema.required.push("title_ja");
      page_global.table_row_map.schema.required.push("title_en");
      page_global.table_row_map.schema.required.push("lang");
      page_global.table_row_map.schema.required.push("pubdate");
      page_global.table_row_map.mapping['title_ja'] = mapping_value;
      page_global.table_row_map.mapping['title_en'] = mapping_value;
      page_global.table_row_map.mapping['lang'] = mapping_value;
      page_global.table_row_map.mapping['pubdate'] = mapping_value;
      page_global.table_row_map.mapping['keywords'] = mapping_value;
      page_global.table_row_map.mapping['keywords_en'] = mapping_value;

      // テーブルの行をトラバースし、マップに追加する
      err_input_id = []
      $.each(page_global.table_row, function(idx, row_id){
        var tmp = {}
        tmp.title = $('#txt_title_'+row_id).val();
        tmp.input_type = $('#select_input_type_'+row_id).val();
        tmp.input_value = "";
        tmp.input_minItems = $('#minItems_'+row_id).val();
        tmp.input_maxItems = $('#maxItems_'+row_id).val();
        tmp.option = {}
        tmp.option.required = $('#chk_'+row_id+'_0').is(':checked')?true:false;
        tmp.option.multiple = $('#chk_'+row_id+'_1').is(':checked')?true:false;
        tmp.option.showlist = $('#chk_'+row_id+'_2').is(':checked')?true:false;
        tmp.option.crtf = $('#chk_'+row_id+'_3').is(':checked')?true:false;
        tmp.option.hidden = $('#chk_'+row_id+'_4').is(':checked')?true:false;
        page_global.table_row_map.mapping[row_id] = mapping_value;
        if(tmp.option.required) {
          page_global.table_row_map.schema.required.push(row_id);
        }
        if(tmp.input_type == 'text' || tmp.input_type == 'textarea') {
          if(tmp.option.multiple) {
            page_global.table_row_map.schema.properties[row_id] = {
              type: "array",
              title: tmp.title,
              minItems: tmp.input_minItems,
              maxItems: tmp.input_maxItems,
              items: {
                type: "object",
                properties: {
                  interim: {type: "string"}    // [interim]は本当の意味を持たない
                }
              }
            }
            page_global.table_row_map.form.push({
              key: row_id,
              add: "New",
              style: {add:"btn-success"},
              items: [{
                key: row_id+'[].interim',
                type: tmp.input_type,
                notitle: true
              }]
            });
          } else {
            page_global.table_row_map.schema.properties[row_id] = {
              type: "string",
              title: tmp.title,
              format: tmp.input_type    // text|textarea
            }
            page_global.table_row_map.form.push({
              key: row_id,
              title: tmp.title,
              type: tmp.input_type    // text|textarea
            });
          }
        } else if(tmp.input_type == 'datetime') {
          if(tmp.option.multiple) {
            page_global.table_row_map.schema.properties[row_id] = {
              type: "array",
              title: tmp.title,
              minItems: tmp.input_minItems,
              maxItems: tmp.input_maxItems,
              items: {
                type: "object",
                properties: {
                  interim: {type: "string"}    // [interim]は本当の意味を持たない
                }
              }
            }
            page_global.table_row_map.form.push({
              key: row_id,
              add: "New",
              style: {add:"btn-success"},
              items: [{
                key: row_id+'[].interim',
                type: "template",
                format: "yyyy-MM-dd",
                templateUrl: "/static/templates/weko_deposit/datepicker.html",
                notitle: true
              }]
            });
          } else {
            page_global.table_row_map.schema.properties[row_id] = {
              type: "string",
              title: tmp.title,
              format: "template"
            }
            page_global.table_row_map.form.push({
              key: row_id,
              type: "template",
              title: tmp.title,
              format: "yyyy-MM-dd",
              templateUrl: "/static/templates/weko_deposit/datepicker.html"
            });
          }
        } else if(tmp.input_type == 'checkboxes') {
          tmp.input_value = $("#schema_"+row_id).find(".select-value-setting").val();
          enum_tmp = []
          titleMap_tmp = []
          $.each(tmp.input_value.split('|'), function(i,v){
            enum_tmp.push(v);
            titleMap_tmp.push({value:v, name:v});
          })

          if(tmp.option.multiple) {
            // 選択式(プルダウン)(複数可)
            page_global.table_row_map.schema.properties[row_id] = {
              type: "array",
              title: tmp.title,
              minItems: tmp.input_minItems,
              maxItems: tmp.input_maxItems,
              items: {
                type: "object",
                properties: {
                  "interim": {
                    type: "array",
                    items: {
                      type: "string",
                      enum: enum_tmp
                    }
                  }
                }
              }
            }
            page_global.table_row_map.form.push({
              key: row_id,
              add: "New",
              style: {add:"btn-success"},
              items: [{
                key: row_id+'[].interim',
                type: tmp.input_type,         // checkboxes
                notitle: true,
                titleMap: titleMap_tmp
              }]
            });
          } else {
            // 選択式(プルダウン)
            page_global.table_row_map.schema.properties[row_id] = {
              type: "array",
              title: tmp.title,
              items: {
                type: "string",
                enum: enum_tmp
              }
            }
            page_global.table_row_map.form.push({
              key: row_id,
              type: tmp.input_type,         // checkboxes
              titleMap: titleMap_tmp
            });
          }
        } else if(tmp.input_type == 'radios' || tmp.input_type == 'select') {
          tmp.input_value = $("#schema_"+row_id).find(".select-value-setting").val();
          enum_tmp = []
          titleMap_tmp = []
          $.each(tmp.input_value.split('|'), function(i,v){
            enum_tmp.push(v);
            titleMap_tmp.push({value:v, name:v});
          })

          if(tmp.option.multiple) {
            page_global.table_row_map.schema.properties[row_id] = {
              type: "array",
              title: tmp.title,
              minItems: tmp.input_minItems,
              maxItems: tmp.input_maxItems,
              items: {
                type: "object",
                properties: {
                  interim: {                  // [interim]は本当の意味を持たない
                    type: "string",
                    enum: enum_tmp
                  }
                }
              }
            }
            page_global.table_row_map.form.push({
              key: row_id,
              add: "New",
              style: {add:"btn-success"},
              items: [{
                key: row_id+'[].interim',
                type: tmp.input_type,    // radios|select
                notitle: true,
                titleMap: titleMap_tmp
              }]
            });
          } else {
            page_global.table_row_map.schema.properties[row_id] = {
              type: "string",
              title: tmp.title,
              enum: enum_tmp
            }
            page_global.table_row_map.form.push({
              key: row_id,
              type: tmp.input_type,    // radios|select
              titleMap: titleMap_tmp
            });
          }
        } else if(tmp.input_type == 'object') {
          editor = page_json_editor['schema_'+row_id];
          page_global.schemaeditor.schema[row_id] = editor.getValue();
          if(tmp.option.multiple) {
            page_global.table_row_map.schema.properties[row_id] = {
              type: "array",
              title: tmp.title,
              minItems: tmp.input_minItems,
              maxItems: tmp.input_maxItems,
              items: {
                type: "object",
                properties: page_global.schemaeditor.schema[row_id].properties,
                required: page_global.schemaeditor.schema[row_id].required
              }
            }
          } else {
            page_global.table_row_map.schema.properties[row_id] = {
              type: "object",
              title: tmp.title,
              properties: page_global.schemaeditor.schema[row_id].properties,
              required: page_global.schemaeditor.schema[row_id].required
            }
          }
          page_global.table_row_map.form.push({key: row_id});
        }

        page_global.meta_list[row_id] = tmp;
      });
    }

    // add new meta table row
    $('#btn_new_itemtype_meta').on('click', function(){
      new_meta_row('item_'+$.now());
    });
    function new_meta_row(row_id) {
      var row_template = '<tr id="tr_' + row_id + '">'
          + '<td><input type="text" class="form-control" id="txt_title_' + row_id + '" value=""></td>'
          + '<td><div class="form-inline"><div class="form-group">'
          + '  <label class="sr-only" for="select_input_type_'+row_id+'">select_input_type</label>'
          + '  <select class="form-control change_input_type" id="select_input_type_' + row_id + '" metaid="' + row_id + '">'
          + '    <option value="text" selected>テキスト</option>'
          + '    <option value="textarea">テキストエリア</option>'
          + '    <option value="checkboxes">チェックボックス</option>'
          + '    <option value="radios">選択式(ラジオ)</option>'
          + '    <option value="select">選択式(プルダウン)</option>'
          + '    <option value="datetime">日付</option>'
          + '    <option value="object">オブジェクト</option>'
          + '  </select>'
          + '  </div></div>'
          + '  <div class="hide" id="arr_size_' + row_id + '">'
          + '    <div class="panel panel-default"><div class="panel-body">'
          + '    <form class="form-inline">'
          + '      <div class="form-group">'
          + '        <label for="minItems_'+row_id+'">minItems</label>'
          + '        <input type="number" class="form-control" id="minItems_'+row_id+'" placeholder="" value="1">'
          + '      </div>'
          + '      <div class="form-group">'
          + '        <label for="maxItems_'+row_id+'">maxItems</label>'
          + '        <input type="number" class="form-control" id="maxItems_'+row_id+'" placeholder="" value="2">'
          + '      </div>'
          + '    </form>'
          + '    </div></div>'
          + '  </div>'
          + '  <div id="schema_' + row_id + '"></div>'
          + '</td>'
          + '<td>'
          + '  <div class="checkbox" id="chk_prev_' + row_id + '_0">'
          + '   <label><input type="checkbox" id="chk_' + row_id + '_0" value="required">必須</label>'
          + '  </div>'
          + '  <div class="checkbox" id="chk_prev_' + row_id + '_1">'
          + '    <label><input type="checkbox" id="chk_' + row_id + '_1" value="multiple">複数可</label>'
          + '  </div>'
          + '  <div class="checkbox" id="chk_prev_' + row_id + '_2">'
          + '    <label><input type="checkbox" id="chk_' + row_id + '_2" value="showlist">一覧表示</label>'
          + '  </div>'
          + '  <div class="checkbox" id="chk_prev_' + row_id + '_3">'
          + '    <label><input type="checkbox" id="chk_' + row_id + '_3" value="crtf">改行指定</label>'
          + '  </div>'
          + '  <div class="checkbox" id="chk_prev_' + row_id + '_4">'
          + '    <label><input type="checkbox" id="chk_' + row_id + '_4" value="hidden">非表示</label>'
          + '  </div>'
          + '</td>'
          + '<td>'
          + '  <div class="btn-group-vertical" role="group" aria-label="入替">'
          + '    <button type="button" class="btn btn-default sortable_up" id="btn_up_' + row_id + '" metaid="' + row_id + '">↑</button>'
          + '    <button type="button" class="btn btn-default sortable_down" id="btn_down_' + row_id + '" metaid="' + row_id + '">↓</button>'
          + '  </div>'
          + '</td>'
          + '<td>'
          + '  <button type="button" class="btn btn-danger" id="btn_del_' + row_id + '">削除</button>'
          + '</td>'
          + '</tr>';
      $('#tbody_itemtype').append(row_template);
      page_global.table_row.push(row_id);
      initSortedBtn();

      // Dynamic additional click event
      // メタ項目の削除関数をダイナミックに登録する
      $('#tbody_itemtype').on('click', 'tr td #btn_del_'+row_id, function(){
        page_global.table_row.splice($.inArray(row_id,page_global.table_row),1);
        $('#tr_' + row_id).remove();
        initSortedBtn();
      });
      // チェックボックス「複数可」が選択状態になると、サイズのセットボックスを表示する
      $('#tbody_itemtype').on('click', 'tr td #chk_'+row_id+'_1', function(){
        if($('#chk_'+row_id+'_1').is(':checked')) {
          $('#arr_size_' + row_id).removeClass('hide');
        } else {
          $('#arr_size_' + row_id).addClass('hide');
        }
      });
    }

    $('#tbody_itemtype').on('click', '.sortable_up', function(){
      var cur_row_id = $(this).attr('metaid');
      var up_row_idx = $.inArray(cur_row_id,page_global.table_row);
      if(up_row_idx === 0) {
        // first row
        return;
      }
      up_row_idx = up_row_idx-1;
      var up_row_id = page_global.table_row[up_row_idx];
      $('#tr_'+cur_row_id).after($('#tr_'+up_row_id));
      page_global.table_row.splice(up_row_idx,1);
      var cur_row_idx = $.inArray(cur_row_id,page_global.table_row);
      if(cur_row_idx == page_global.table_row.length-1) {
        page_global.table_row.push(up_row_id);
      } else {
        page_global.table_row.splice(cur_row_idx+1,0,up_row_id);
      }
      initSortedBtn();
    })

    $('#tbody_itemtype').on('click', '.sortable_down', function(){
      var cur_row_id = $(this).attr('metaid');
      var down_row_idx = $.inArray(cur_row_id,page_global.table_row);
      if(down_row_idx === page_global.table_row.length-1) {
        // last row
        return;
      }
      down_row_idx = down_row_idx+1;
      var down_row_id = page_global.table_row[down_row_idx];
      $('#tr_'+cur_row_id).before($('#tr_'+down_row_id));
      page_global.table_row.splice(down_row_idx,1);
      var cur_row_idx = $.inArray(cur_row_id,page_global.table_row);
      page_global.table_row.splice(cur_row_idx,0,down_row_id);
      initSortedBtn();
    })

    function initSortedBtn() {
      $('.sortable_up').removeClass('disabled');
      $('.sortable_down').removeClass('disabled');
      $('#btn_up_'+page_global.table_row[0]).addClass('disabled');
      $('#btn_down_'+page_global.table_row[page_global.table_row.length-1]).addClass('disabled');
    }

    // itemtype select input change
    $('#tbody_itemtype').on('change', '.change_input_type', function(){
      var meta_id = $(this).attr('metaid');
      if('object' == $(this).val()) {
        product = {
          type: "object",
          properties: {},
          required: []
        }
        product.properties['sub'+meta_id] = {"type": "string","format": "text"}
        $('#chk_prev_' + meta_id + '_1').addClass('disabled');
        $('#chk_' + meta_id + '_1').attr('disabled', true);
        render_object('schema_'+meta_id, product);
      } else if('checkboxes' == $(this).val() || 'radios' == $(this).val()
              || 'select' == $(this).val()){
        $('#chk_prev_' + meta_id + '_1').removeClass('disabled');
        $('#chk_' + meta_id + '_1').attr('disabled', false);
        render_select('schema_'+meta_id, '');
      } else {
        $('#chk_prev_' + meta_id + '_1').removeClass('disabled');
        $('#chk_' + meta_id + '_1').attr('disabled', false);
        render_empty('schema_'+meta_id);
      }
    });

    function render_empty(elementId) {
      $('#'+elementId).empty();
    }

    function render_text(elementId, initval) {
      $('#'+elementId).html('<input type="text" '
        + 'class="form-control select-value-setting" '
        + 'value="' + initval + '">');
    }

    function render_select(elementId, initval) {
      $('#'+elementId).html('<div class="panel panel-default"><div class="panel-body">'
        + '<input type="text" class="form-control select-value-setting" '
        + 'value="' + initval + '" placeholder="選択肢を「|」区切りで入力して下さい"></div></div>');
    }

    function render_object(elementId, initschema) {
      element = document.getElementById(elementId);
      var editor = new JSONSchemaEditor(element, {
        startval: initschema
      });
      page_json_editor[elementId] = editor;
    }

    function send(url, data){
      $.ajax({
        method: 'POST',
        url: url,
        async: true,
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(data),
        success: function(data,textStatus){
          $('.modal-body').text(data.msg);
          $('#myModal').modal('show');
        },
        error: function(textStatus,errorThrown){
          $('.modal-body').text('Error: ' + JSON.stringify(textStatus));
          $('#myModal').modal('show');
        }
      });
    }

    if($('#item-type-lists').val().length > 0) {
      $.get('/itemtypes/' + $('#item-type-lists').val() + '/render', function(data, status){
        $.each(data.table_row, function(idx, row_id){
          new_meta_row(row_id);
          $('#txt_title_'+row_id).val(data.meta_list[row_id].title);
          $('#select_input_type_'+row_id).val(data.meta_list[row_id].input_type);
          $('#minItems_'+row_id).val(data.meta_list[row_id].input_minItems);
          $('#maxItems_'+row_id).val(data.meta_list[row_id].input_maxItems);
          $('#chk_'+row_id+'_0').attr('checked', data.meta_list[row_id].option.required);
          $('#chk_'+row_id+'_1').attr('checked', data.meta_list[row_id].option.multiple);
          $('#chk_'+row_id+'_2').attr('checked', data.meta_list[row_id].option.showlist);
          $('#chk_'+row_id+'_3').attr('checked', data.meta_list[row_id].option.crtf);
          $('#chk_'+row_id+'_4').attr('checked', data.meta_list[row_id].option.hidden);

          if(data.meta_list[row_id].option.multiple) {
            $('#arr_size_' + row_id).removeClass('hide');
          }

          if('object' == data.meta_list[row_id].input_type) {
            $('#chk_prev_' + row_id + '_1').addClass('disabled');
            $('#chk_' + row_id + '_1').attr('disabled', true);
            render_object('schema_'+row_id, data.schemaeditor.schema[row_id]);
          } else if('checkboxes' == data.meta_list[row_id].input_type || 'radios' == data.meta_list[row_id].input_type
                  || 'select' == data.meta_list[row_id].input_type){
            render_select('schema_'+row_id, data.meta_list[row_id].input_value);
          } else {
            render_empty('schema_'+row_id);
          }
        });
      });
    }
});
