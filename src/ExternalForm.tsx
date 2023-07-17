import React, { useState } from 'react';
import { Modal, Form, Button, Input } from 'antd';
import { ExternalList } from './App';

interface ExternalFormProps {
  onOk: (data: ExternalList) => void;
}

const ExternalForm: React.FC<ExternalFormProps> = ({ onOk }) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Modal
        width={700}
        open={visible}
        onCancel={() => setVisible(false)}
        onOk={async () => {
          const formData = await form.validateFields();
          onOk(formData.externalList);
          setVisible(false)
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 30 }}>
          <Form.List name="externalList">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ display: 'flex', gap: 8 }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'libraryUrl']}
                      rules={[{ required: true }]}
                      style={{ width: '100%' }}
                    >
                      <Input placeholder="libraryUrl" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'libraryName']}
                      style={{ width: 120, flex: 'none' }}
                    >
                      <Input placeholder="libraryName" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'libraryGlobal']}
                      style={{ width: 120, flex: 'none' }}
                    >
                      <Input placeholder="libraryGlobal" />
                    </Form.Item>
                    <Button onClick={() => remove(name)}>删除</Button>
                  </div>
                ))}
                <Form.Item>
                  <Button onClick={() => add()}>添加</Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
      <Button onClick={() => setVisible(true)}>添加</Button>
    </>
  );
};

export default ExternalForm;
