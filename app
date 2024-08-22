def create_report_excel(report, location):
    workbook = xlsxwriter.Workbook(location)
    for result_id, result_data in report.items():
        for key in result_data['categories'].keys():
            sheetname = f"{result_id}_{key}".replace(':', '').replace(' ', '').replace('BIOS', '').replace('/', '').replace('?', '').replace('\\', '|')
            if len(sheetname) > 30:
                start = len(sheetname) - 30
            else:
                start = 0
            worksheet = workbook.add_worksheet(sheetname[start:])
            worksheet.set_column('A:Z', 25)
            bold = workbook.add_format({'bold': True})
            worksheet.write('A1', key, bold)

            row_num = 0
            for i in range(len(result_data['categories'][key])):
                dic = result_data['categories'][key][i]
                col_num = 0
                row_num += 1
                for k, value in dic.items():
                    worksheet.write(0, col_num, k, bold)
                    worksheet.write(row_num, col_num, value)
                    col_num += 1
    workbook.close()




from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
import xlsxwriter
import os
from django.http import HttpResponse
from wsgiref.util import FileWrapper
from myapp.models import Result  # Update with your actual models

class FileDownloadListAPIView(generics.ListAPIView):
    def post(self, request, *args, **kwargs):
        result_ids = request.data.get('result_ids', [])
        report = {}

        for result_id in result_ids:
            result = Result.objects.get(id=result_id)
            categories = Result.Category.objects.filter(result=result).order_by('order')
            rows = Result.Row.objects.filter(category__in=categories).order_by('order')
            fields = Result.Field.objects.filter(row__in=rows)

            result_data = {}
            result_data['tool_name'] = result.module.tool.name
            result_data['hostname'] = result.hostname
            result_data['module_name'] = result.module.name
            result_data['module_id'] = result.module.id
            result_data['categories'] = {}

            for category in categories:
                rows = Result.Row.objects.filter(category=category).order_by('order')
                rows_list = []
                for row in rows:
                    fields = Result.Field.objects.filter(row=row).order_by('order')
                    fields_list = {}
                    for field in fields:
                        fields_list[field.attribute_slug] = field.value
                    rows_list.append(fields_list)
                result_data['categories'][category.name_slug] = rows_list

            report[result_id] = result_data

        location = os.path.join(BASE_DIR, "temp", "ExcelInventoryReport.xlsx")
        create_report_excel(report, location)
        document = open(location, 'rb')
        response = HttpResponse(FileWrapper(document), content_type='application/msword')
        response['Content-Disposition'] = 'attachment; filename="ExcelInventoryReport.xlsx"'
        return response



def create_report_excel(report, location):
    workbook = xlsxwriter.Workbook(location)
    
    # Extract all unique sheet names (category name slugs)
    sheetnames = set()
    for result_data in report.values():
        sheetnames.update(result_data['categories'].keys())
    
    for sheetname in sheetnames:
        worksheet = workbook.add_worksheet(sheetname[:30])
        worksheet.set_column('A:Z', 25)
        bold = workbook.add_format({'bold': True})

        # Write headers
        headers = ['Hostname']
        for result_data in report.values():
            if sheetname in result_data['categories']:
                headers += result_data['categories'][sheetname][0].keys()
                break

        for col_num, header in enumerate(headers):
            worksheet.write(0, col_num, header, bold)

        row_num = 1
        for result_id, result_data in report.items():
            if sheetname in result_data['categories']:
                for row in result_data['categories'][sheetname]:
                    worksheet.write(row_num, 0, result_data['hostname'])  # Write the hostname
                    for col_num, (key, value) in enumerate(row.items(), start=1):
                        worksheet.write(row_num, col_num, value)
                    row_num += 1

    workbook.close()




from rest_framework import generics
from rest_framework.response import Response
import os
import xlsxwriter
from django.http import HttpResponse
from wsgiref.util import FileWrapper
from myapp.models import Result  # Update with your actual models

class FileDownloadListAPIView(generics.ListAPIView):
    def post(self, request, *args, **kwargs):
        result_ids = request.data.get('result_ids', [])
        report = {}

        for result_id in result_ids:
            result = Result.objects.get(id=result_id)
            categories = Result.Category.objects.filter(result=result).order_by('order')
            rows = Result.Row.objects.filter(category__in=categories).order_by('order')
            fields = Result.Field.objects.filter(row__in=rows)

            result_data = {}
            result_data['hostname'] = result.hostname
            result_data['categories'] = {}

            for category in categories:
                rows = Result.Row.objects.filter(category=category).order_by('order')
                rows_list = []
                for row in rows:
                    fields = Result.Field.objects.filter(row=row).order_by('order')
                    fields_list = {}
                    for field in fields:
                        fields_list[field.attribute_slug] = field.value
                    rows_list.append(fields_list)
                result_data['categories'][category.name_slug] = rows_list

            report[result_id] = result_data

        location = os.path.join(BASE_DIR, "temp", "ExcelInventoryReport.xlsx")
        create_report_excel(report, location)
        document = open(location, 'rb')
        response = HttpResponse(FileWrapper(document), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="ExcelInventoryReport.xlsx"'
        return response


def create_report_excel(report, location):
    workbook = xlsxwriter.Workbook(location)
    
    # Extract all unique sheet names (category name slugs)
    sheetnames = set()
    for result_data in report.values():
        sheetnames.update(result_data['categories'].keys())
    
    for sheetname in sheetnames:
        worksheet = workbook.add_worksheet(sheetname[:30])
        worksheet.set_column('A:Z', 25)
        bold = workbook.add_format({'bold': True})

        # Write headers
        headers = ['Hostname']
        for result_data in report.values():
            if sheetname in result_data['categories'] and result_data['categories'][sheetname]:
                headers += result_data['categories'][sheetname][0].keys()
                break

        for col_num, header in enumerate(headers):
            worksheet.write(0, col_num, header, bold)

        row_num = 1
        for result_id, result_data in report.items():
            if sheetname in result_data['categories']:
                for row in result_data['categories'][sheetname]:
                    worksheet.write(row_num, 0, result_data['hostname'])  # Write the hostname
                    for col_num, (key, value) in enumerate(row.items(), start=1):
                        worksheet.write(row_num, col_num, value)
                    row_num += 1

    workbook.close()


from rest_framework import generics
from rest_framework.response import Response
import os
import xlsxwriter
from django.http import HttpResponse
from wsgiref.util import FileWrapper
from myapp.models import Result  # Update with your actual models

class FileDownloadListAPIView(generics.ListAPIView):
    def post(self, request, *args, **kwargs):
        result_ids = request.data.get('result_ids', [])
        report = {}

        for result_id in result_ids:
            result = Result.objects.get(id=result_id)
            categories = Result.Category.objects.filter(result=result).order_by('order')
            rows = Result.Row.objects.filter(category__in=categories).order_by('order')
            fields = Result.Field.objects.filter(row__in=rows)

            result_data = {}
            result_data['hostname'] = result.hostname
            result_data['categories'] = {}

            for category in categories:
                rows = Result.Row.objects.filter(category=category).order_by('order')
                rows_list = []
                for row in rows:
                    fields = Result.Field.objects.filter(row=row).order_by('order')
                    fields_list = {}
                    for field in fields:
                        fields_list[field.attribute_slug] = field.value
                    rows_list.append(fields_list)
                result_data['categories'][category.name_slug] = rows_list

            report[result_id] = result_data

        location = os.path.join(BASE_DIR, "temp", "ExcelInventoryReport.xlsx")
        create_report_excel(report, location)
        document = open(location, 'rb')
        response = HttpResponse(FileWrapper(document), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="ExcelInventoryReport.xlsx"'
        return response





In that case, we can use a more general approach to update the related fields, regardless of their names. We can use Django's model introspection to get the fields of the model and check if they are ManyToManyFields or ForeignKey fields.

Here's an updated code snippet:
```
import json
import uuid
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.apps import apps
from django.db.models.fields import ManyToManyField, ForeignKey

def import_json_data(json_file):
    with open(json_file, 'r') as f:
        data = json.load(f)

    # Create a mapping of old UUIDs to new UUIDs
    uuid_mapping = {}

    # Update UUIDs in the data
    for model_data in data:
        old_uuid = model_data['pk']
        new_uuid = uuid.uuid4()
        uuid_mapping[old_uuid] = new_uuid
        model_data['pk'] = new_uuid

        # Get the model class
        model_class = apps.get_model(model_data['model'])

        # Update related fields
        for field in model_class._meta.get_fields():
            if isinstance(field, (ManyToManyField, ForeignKey)):
                field_name = field.name
                if field_name in model_data:
                    if isinstance(field, ManyToManyField):
                        # ManyToManyField
                        model_data[field_name] = [uuid_mapping.get(v, v) for v in model_data[field_name]]
                    else:
                        # ForeignKey
                        model_data[field_name] = uuid_mapping.get(model_data[field_name], model_data[field_name])

    # Dump the updated data to a new JSON file
    with open('updated_data.json', 'w') as f:
        json.dump(data, f, cls=DjangoJSONEncoder)

    # Load the updated data into the database
    with transaction.atomic():
        call_command('loaddata', 'updated_data.json')
```
This code uses Django's model introspection to get the fields of the model and checks if they are ManyToManyFields or ForeignKey fields. If they are, it updates the related fields accordingly.

This approach should work regardless of the names of the ManyToManyFields or ForeignKey fields in your models.
